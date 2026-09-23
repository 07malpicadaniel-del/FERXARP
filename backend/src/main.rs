use axum::{routing::get, Router};
use dotenv::dotenv;
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use std::env;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::info;

// Definimos el estado compartido que inyectaremos en todos los endpoints
pub mod api;
pub mod models;
pub struct AppState {
    pub db: Pool<Postgres>,
    pub jwt_secret: String,
}

#[tokio::main]
async fn main() {
    // 1. Inicializar el sistema de logs y leer el archivo .env
    tracing_subscriber::fmt::init();
    dotenv().ok();

    info!("Iniciando el servidor principal de Fexarp...");

    // 2. Extraer las credenciales
    let database_url = env::var("DATABASE_URL").expect("Falta DATABASE_URL en el archivo .env");
    let jwt_secret = env::var("JWT_SECRET").expect("Falta JWT_SECRET en el archivo .env");

    // 3. Establecer la conexión con Supabase
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Error crítico: No se pudo conectar a Supabase");

    info!("Conexión a PostgreSQL (Supabase) establecida exitosamente.");

    // 4. Empaquetar el estado para compartirlo de forma segura entre hilos
    let shared_state = Arc::new(AppState {
        db: pool,
        jwt_secret,
    });

// 5. Configurar el enrutador y los permisos CORS
    let app = Router::new()
        .route("/health", get(health_check))
        .nest("/api/auth", api::auth::router()) // <-- Conexión del microservicio
        .nest("/api/donations", api::donations::router())
        .layer(CorsLayer::permissive())
        .with_state(shared_state);

    // 6. Levantar el servidor en el puerto 8000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    info!("Servidor escuchando en http://localhost:8000");
    axum::serve(listener, app).await.unwrap();
}

// Endpoint de prueba rápido
async fn health_check() -> &'static str {
    "¡Fexarp API Online! El cerebro en Rust está conectado a Supabase."
}
