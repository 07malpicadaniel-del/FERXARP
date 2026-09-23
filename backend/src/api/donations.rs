use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{api::auth::Claims, AppState};

#[derive(Deserialize)]
pub struct CreateDonationRequest {
    pub title: String,
    pub description: String,
    pub quantity: i32,
}

#[derive(Serialize)]
pub struct DonationResponse {
    pub id: Uuid,
    pub user_id: Uuid, // <-- Cambiado a user_id para coincidir con tu esquema
    pub title: String,
    pub description: String,
    pub quantity: i32,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", post(create_donation).get(list_donations))
}

// POST /api/donations - Crear una nueva donación
async fn create_donation(
    claims: Claims, 
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateDonationRequest>,
) -> Result<(StatusCode, Json<DonationResponse>), (StatusCode, String)> {
    
    let record = sqlx::query!(
        r#"
        INSERT INTO donations (user_id, title, description, quantity) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, user_id, title, description, quantity
        "#,
        claims.sub,
        payload.title,
        payload.description,
        payload.quantity
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error en BD: {}", e)))?;

    Ok((StatusCode::CREATED, Json(DonationResponse {
        id: record.id,
        user_id: record.user_id,
        title: record.title,
        description: record.description,
        quantity: record.quantity,
    })))
}

// GET /api/donations - Listar las donaciones del usuario
async fn list_donations(
    claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<(StatusCode, Json<Vec<DonationResponse>>), (StatusCode, String)> {
    
    let records = sqlx::query!(
        r#"SELECT id, user_id, title, description, quantity FROM donations WHERE user_id = $1"#,
        claims.sub
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error en BD: {}", e)))?;

    let donations = records.into_iter().map(|rec| DonationResponse {
        id: rec.id,
        user_id: rec.user_id,
        title: rec.title,
        description: rec.description,
        quantity: rec.quantity,
    }).collect();

    Ok((StatusCode::OK, Json(donations)))
}
