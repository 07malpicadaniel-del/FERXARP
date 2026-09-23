use axum::{extract::State, http::StatusCode, routing::{get, post}, Json, Router};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

// Importamos el estado global y el modelo de Role
use crate::{models::user::Role, AppState};

// --- ESTRUCTURAS DE DATOS ---
#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub role: Role,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Claims {
    pub sub: Uuid,
    pub role: Role,
    pub exp: usize, // Expiración
}

// --- ENRUTADOR ---
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(me)) // <-- Nueva ruta protegida integrada
}

// --- CONTROLADORES ---
async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, &'static str), (StatusCode, String)> {
    
    // 1. Encriptar la contraseña
    let hashed_password = hash(&payload.password, DEFAULT_COST)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Insertar en Supabase
    let query = "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)";
    
    sqlx::query(query)
        .bind(&payload.email)
        .bind(&hashed_password)
        .bind(&payload.role)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

    Ok((StatusCode::CREATED, "Usuario registrado exitosamente"))
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), (StatusCode, String)> {
    
    // 1. Buscar al usuario por email
    let user_record = sqlx::query!(
        r#"SELECT id, password_hash, role as "role: Role" FROM users WHERE email = $1"#,
        payload.email
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::UNAUTHORIZED, "Credenciales incorrectas".to_string()))?;

    // 2. Verificar la contraseña
    let is_valid = verify(&payload.password, &user_record.password_hash)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if !is_valid {
        return Err((StatusCode::UNAUTHORIZED, "Credenciales incorrectas".to_string()));
    }

    // 3. Generar el JWT (Válido por 24 horas)
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("Timestamp inválido")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_record.id,
        role: user_record.role,
        exp: expiration,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_ref()),
    ).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::OK, Json(AuthResponse { token })))
}

// --- CONTROLADOR PROTEGIDO DE PRUEBA ---
// Al pedir `claims: Claims` como parámetro, Axum ejecuta automáticamente nuestro Middleware
async fn me(claims: Claims) -> Result<Json<Claims>, (StatusCode, String)> {
    Ok(Json(claims))
}
