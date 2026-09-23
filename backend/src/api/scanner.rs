use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    api::auth::Claims,
    models::user::Role,
    AppState,
};

// --- ESTRUCTURAS DE DATOS ---

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

#[derive(Serialize)]
pub struct MapPoint {
    pub id: Uuid,
    pub name: String,
    pub point_type: String, // "acopio" | "ong"
    pub latitude: f64,
    pub longitude: f64,
    pub status: Option<String>,
    pub details: String,
}

// --- ENRUTADOR ---

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/scan", post(process_scan))
        .route("/tracking/{id}", get(get_tracking_status))
        .route("/map-points", get(get_map_locations))
}

// --- CONTROLADORES ---

// POST /api/scanner/scan - Procesa la lectura física (Restringido a ONGs o Admins)
async fn process_scan(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ScanRequest>,
) -> Result<Json<ScanResponse>, (StatusCode, String)> {
    // Control de acceso por rol (RBAC) con enum Role
    if !matches!(claims.role, Role::Ong | Role::Admin) {
        return Err((
            StatusCode::FORBIDDEN,
            "Acceso denegado: se requieren permisos logísticos ('ong' o 'admin') para escanear y alterar lotes.".to_string(),
        ));
    }

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

// GET /api/scanner/tracking/{id} - Consulta la trazabilidad y datos del lote
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

// GET /api/scanner/map-points - Retorna centros de acopio y ONGs registradas con geolocalización
async fn get_map_locations(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<MapPoint>>, (StatusCode, String)> {
    let mut points = Vec::new();

    // 1. Centro de Distribución y Acopio Central (Hub logístico Fexarp)
    points.push(MapPoint {
        id: Uuid::nil(),
        name: "Centro de Acopio Central Fexarp".to_string(),
        point_type: "acopio".to_string(),
        latitude: 19.1738,
        longitude: -96.1342,
        status: Some("operativo".to_string()),
        details: "Hub logístico de recepción, consolidación y despacho de lotes".to_string(),
    });

    // 2. Consultar ONGs activas con coordenadas registradas en Supabase
    let ngos = sqlx::query!(
        r#"SELECT id, name, latitude, longitude, needs_description FROM ngos WHERE latitude IS NOT NULL AND longitude IS NOT NULL"#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error BD: {}", e)))?;

    for ngo in ngos {
        points.push(MapPoint {
            id: ngo.id,
            name: ngo.name,
            point_type: "ong".to_string(),
            latitude: ngo.latitude.unwrap_or(19.1738),
            longitude: ngo.longitude.unwrap_or(-96.1342),
            status: Some("destino".to_string()),
            details: ngo.needs_description.unwrap_or_else(|| "Recepción y distribución de donaciones".to_string()),
        });
    }

    Ok(Json(points))
}
