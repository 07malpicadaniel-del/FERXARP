# 🌿 Fexarp — Ecosistema de Distribución Solidaria de Excedentes

Plataforma integral orientada a canalizar excedentes operativos y alimentarios de empresas hacia organizaciones sociales verificadas mediante emparejamiento semántico vectorial, geolocalización en tiempo real y trazabilidad física con bitácora inmutable.

---

## 🚀 Estado Actual del Proyecto (Fase 7 Concluida)

* **Backend (Rust / Axum):** 
  * Monolito modular con control de acceso RBAC (`Empresa`, `Ong`, `Ceo`, `Admin`).
  * Motor de emparejamiento híbrido: similitud vectorial (ChromaDB) + fórmula geodésica (Haversine) + análisis cognitivo vía Groq AI (`deepseek-r1-distill-llama-70b`).
  * Bitácora de transiciones y rechazos de stock (`scanner.rs` sobre tabla `delivery_logs`).
  * Módulo de ingesta y siembra local idempotente (`seed.rs`).
* **Frontend (Next.js / Tailwind CSS):**
  * Interfaz con estética botánica mineral e iconografía intuitiva sin jerga técnica.
  * Tableros diferenciados por rol:
    * **Empresa:** Formulario de registro de lotes y grafo interactivo de compatibilidad (`GardenGraph.tsx`).
    * **ONG:** Dosel de absorción de lotes disponibles, apartado con un clic y escáner de recepción.
    * **CEO:** Métricas de sostenibilidad, volumen transferido, beneficiarios directos y $\text{CO}_2\text{e}$ evitado.
    * **Admin TI:** Auditoría y verificación oficial de organizaciones para evitar riesgos de corrupción.
  * Embudo de control logístico en 3 etapas (`/shipments`): *1. Solicitadas*, *2. En Camino*, *3. Finalizadas*.
  * Mapa geoespacial interactivo (`/map`) adaptado con teselas botánicas y rutas de acopio.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Rust 2021, Axum, Tokio, SQLx (PostgreSQL), Jsonwebtoken, Reqwest |
| **Frontend** | Next.js (App Router), React, Tailwind CSS, Leaflet |
| **Bases de Datos** | Supabase (PostgreSQL relacional) + ChromaDB (Base vectorial) |
| **Inteligencia Artificial** | Groq LPU (DeepSeek-R1 Distill Llama 70B) + Embeddings Cosine |

---

## 📁 Estructura del Monorepositorio

```text
FERXARP/
├── backend/                  # Dominio en Rust (Axum + SQLx)
│   ├── src/
│   │   ├── ai/               # ChromaDB client, scorer, matcher y Groq AI
│   │   │   ├── chroma_db.rs
│   │   │   ├── groq.rs
│   │   │   ├── matcher.rs
│   │   │   └── scoring.rs
│   │   ├── api/              # Endpoints HTTP REST
│   │   │   ├── auth.rs       # RBAC, login/registro, verificación ONGs
│   │   │   ├── donations.rs  # CRUD, matching, solicitudes y envíos
│   │   │   ├── metrics.rs    # Agregaciones e impacto para el CEO
│   │   │   ├── scanner.rs    # Salidas, recepciones y rechazos de stock
│   │   │   └── seed.rs       # Ingesta idempotente de Veracruz y Groq test
│   │   ├── models/           # Structs de dominio (User, Ngo, Roles)
│   │   └── main.rs           # Configuración del servidor y ruteo central
│   └── Cargo.toml
├── frontend/                 # Aplicación Next.js (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Vistas de autenticación (Login / Registro)
│   │   │   ├── dashboard/    # Tablero dinámico adaptado según el rol
│   │   │   ├── map/          # Topografía logística sobre Leaflet
│   │   │   └── shipments/    # Embudo de envíos y solicitudes en 3 etapas
│   │   ├── components/       # Componentes visuales (GardenGraph, Navbar, etc.)
│   │   └── lib/api.ts        # Cliente tipado de consumo backend
│   └── package.json
├── documentacion.md          # Documento formal del sistema
└── README.md
