use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    ai::{
        chroma_db::ChromaClient,
        matcher::{rank_ngos_for_donation, NgoCandidate, ScoredMatch},
    },
    api::auth::Claims,
    models::user::Role,
    AppState,
};

// --- ESTRUCTURAS DE DATOS ---

#[derive(Deserialize)]
pub struct CreateDonationRequest {
    pub title: String,
    pub description: Option<String>,
    pub quantity: i32,
}

#[derive(Serialize, Deserialize)]
pub struct DonationResponse {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub quantity: i32,
    pub status: Option<String>,
    pub assigned_ngo_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize)]
pub struct FeedDonationResponse {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub quantity: i32,
    pub status: String,
    pub donor_email: String,
    pub created_at: Option<DateTime<Utc>>,
}

// --- ENRUTADOR ---

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", post(create_donation).get(list_donations))
        .route("/feed", get(list_available_feed))
        .route("/{id}/matches", get(get_donation_matches))
        .route("/{id}/request", post(request_donation))
}

// --- CONTROLADORES ---

// POST /api/donations - Registrar una nueva donación (Restringido a Empresas o Admins)
async fn create_donation(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateDonationRequest>,
) -> Result<(StatusCode, Json<DonationResponse>), (StatusCode, String)> {
    if !matches!(claims.role, Role::Empresa | Role::Admin) {
        return Err((
            StatusCode::FORBIDDEN,
            "Acceso denegado: únicamente perfiles de 'empresa' o 'admin' pueden registrar donaciones.".to_string(),
        ));
    }

    let record = sqlx::query!(
        r#"
        INSERT INTO donations (user_id, title, description, quantity, status) 
        VALUES ($1, $2, $3, $4, 'en_acopio') 
        RETURNING id, user_id, title, description, quantity, status, assigned_ngo_id
        "#,
        claims.sub,
        payload.title,
        payload.description,
        payload.quantity
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error en BD: {}", e)))?;

    Ok((
        StatusCode::CREATED,
        Json(DonationResponse {
            id: record.id,
            user_id: record.user_id,
            title: record.title,
            description: record.description,
            quantity: record.quantity,
            status: record.status,
            assigned_ngo_id: record.assigned_ngo_id,
        }),
    ))
}

// GET /api/donations - Listar donaciones del usuario autenticado
async fn list_donations(
    claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<(StatusCode, Json<Vec<DonationResponse>>), (StatusCode, String)> {
    let records = sqlx::query!(
        r#"
        SELECT id, user_id, title, description, quantity, status, assigned_ngo_id 
        FROM donations 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        "#,
        claims.sub
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error en BD: {}", e)))?;

    let donations = records
        .into_iter()
        .map(|rec| DonationResponse {
            id: rec.id,
            user_id: rec.user_id,
            title: rec.title,
            description: rec.description,
            quantity: rec.quantity,
            status: rec.status,
            assigned_ngo_id: rec.assigned_ngo_id,
        })
        .collect();

    Ok((StatusCode::OK, Json(donations)))
}

// GET /api/donations/feed - Consulta lotes activos para el tablero de ONGs
async fn list_available_feed(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<FeedDonationResponse>>, (StatusCode, String)> {
    let records = sqlx::query!(
        r#"
        SELECT 
            d.id, 
            d.title, 
            d.description, 
            d.quantity, 
            COALESCE(d.status, 'en_acopio') as "status!", 
            d.created_at, 
            u.email as donor_email
        FROM donations d
        JOIN users u ON d.user_id = u.id
        WHERE d.status = 'en_acopio' OR d.status IS NULL
        ORDER BY d.created_at DESC
        LIMIT 50
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error en BD: {}", e)))?;

    let feed = records
        .into_iter()
        .map(|r| FeedDonationResponse {
            id: r.id,
            title: r.title,
            description: r.description,
            quantity: r.quantity,
            status: r.status,
            donor_email: r.donor_email,
            created_at: r.created_at,
        })
        .collect();

    Ok(Json(feed))
}

// GET /api/donations/{id}/matches - Calcular ranking de ONGs prioritarias
async fn get_donation_matches(
    _claims: Claims,
    Path(donation_id): Path<Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<ScoredMatch>>, (StatusCode, String)> {
    // 1. Obtener la donación objetivo desde Supabase
    let donation = sqlx::query!(
        r#"SELECT title, description FROM donations WHERE id = $1"#,
        donation_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Donación no encontrada".to_string()))?;

    let search_text = format!("{} {}", donation.title, donation.description.unwrap_or_default());

    // 2. Consultar similitud vectorial en ChromaDB
    let chroma = ChromaClient::new(None);
    let similarities = chroma.query_similar_ngos(&search_text, 10).await.unwrap_or_default();

    // 3. Obtener candidatos registrados en la tabla ngos
    let ngos_records = sqlx::query!(
        r#"SELECT id, name, needs_description, latitude, longitude FROM ngos"#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let candidates: Vec<NgoCandidate> = ngos_records
        .into_iter()
        .map(|r| NgoCandidate {
            id: r.id,
            name: r.name,
            needs_description: r.needs_description,
            latitude: r.latitude,
            longitude: r.longitude,
            urgency_level: 4,
        })
        .collect();

    // 4. Calcular distancias y ponderar el score final (origen base Veracruz: 19.1738, -96.1342)
    let origin_lat = 19.1738;
    let origin_lon = -96.1342;
    let ranked = rank_ngos_for_donation(origin_lat, origin_lon, &similarities, &candidates, 50.0);

    Ok(Json(ranked))
}

// POST /api/donations/{id}/request - Solicitud formal de la ONG para apartar un lote
async fn request_donation(
    claims: Claims,
    Path(donation_id): Path<Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if !matches!(claims.role, Role::Ong | Role::Admin) {
        return Err((
            StatusCode::FORBIDDEN,
            "Únicamente organizaciones sociales o administradores pueden solicitar lotes.".to_string(),
        ));
    }

    // 1. Obtener ID de la ONG vinculada al usuario autenticado
    let ngo = sqlx::query!(
        r#"SELECT id FROM ngos WHERE user_id = $1"#,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error BD: {}", e)))?
    .ok_or((
        StatusCode::NOT_FOUND,
        "Perfil de ONG no encontrado para este usuario.".to_string(),
    ))?;

    // 2. Registrar solicitud en donation_requests
    sqlx::query!(
        r#"
        INSERT INTO donation_requests (donation_id, ngo_id, status)
        VALUES ($1, $2, 'pendiente')
        ON CONFLICT (donation_id, ngo_id) DO NOTHING
        "#,
        donation_id,
        ngo.id
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error al crear solicitud: {}", e)))?;

    // 3. Actualizar la donación para apartarla
    sqlx::query!(
        r#"
        UPDATE donations 
        SET assigned_ngo_id = $1, status = 'reservado' 
        WHERE id = $2 AND (status = 'en_acopio' OR status IS NULL)
        "#,
        ngo.id,
        donation_id
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Error al reservar lote: {}", e)))?;

    Ok(StatusCode::CREATED)
}
