use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{api::auth::Claims, AppState};

#[derive(Deserialize)]
pub struct ScanRequest {
    pub donation_id: Uuid,
    pub action: ScanAction,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ScanAction {
    Entrada, // Ingreso al centro de acopio
    Salida,  // Despacho / En tránsito a la ONG
    Entrega, // Recepción final por la ONG
}

impl ScanAction {
    pub fn to_status(&self) -> &'static str {
        match self {
            ScanAction::Entrada => "en_acopio",
            ScanAction::Salida => "en_transito",
            ScanAction::Entrega => "entregado",
        }
    }
}

#[derive(Serialize)]
pub struct ScanResponse {
    pub donation_id: Uuid,
    pub previous_status: Option<String>,
    pub new_status: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct TrackingResponse {
    pub id: Uuid,
    pub title: String,
    pub quantity: i32,
    pub status: Option<String>,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/scan", post(process_scan))
        .route("/tracking/{id}", get(get_tracking_status))
}

// POST /api/scanner/scan - Procesa la lectura física y actualiza el estado
async fn process_scan(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ScanRequest>,
) -> Result<Json<ScanResponse>, (StatusCode, String)> {
    let new_status = payload.action.to_status();

    // 1. Obtener estado previo
    let current = sqlx::query!(
        r#"SELECT status FROM donations WHERE id = $1"#,
        payload.donation_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error en BD: {}", e)))?
    .ok_or((StatusCode::NOT_FOUND, "Lote de donación no encontrado".to_string()))?;

    // 2. Actualizar el estado en Supabase
    sqlx::query!(
        r#"
        UPDATE donations 
        SET status = $1 
        WHERE id = $2
        "#,
        new_status,
        payload.donation_id
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error al actualizar: {}", e)))?;

    Ok(Json(ScanResponse {
        donation_id: payload.donation_id,
        previous_status: current.status,
        new_status: new_status.to_string(),
        message: format!("Lote actualizado a: {}", new_status),
    }))
}

// GET /api/scanner/tracking/{id} - Consulta la trazabilidad de un lote
async fn get_tracking_status(
    _claims: Claims,
    Path(id): Path<Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<TrackingResponse>, (StatusCode, String)> {
    let record = sqlx::query!(
        r#"SELECT id, title, quantity, status FROM donations WHERE id = $1"#,
        id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error en BD: {}", e)))?
    .ok_or((StatusCode::NOT_FOUND, "Lote no encontrado".to_string()))?;

    Ok(Json(TrackingResponse {
        id: record.id,
        title: record.title,
        quantity: record.quantity,
        status: record.status,
    }))
}
