use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GroqEvaluation {
    pub compatibility_score: f64,
    pub reasoning: String,
    pub priority_level: String,
}

pub struct GroqClient {
    client: Client,
    api_key: Option<String>,
}

impl GroqClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            api_key: env::var("GROQ_API_KEY").ok(),
        }
    }

    pub async fn evaluate_fit(
        &self,
        donation_title: &str,
        donation_desc: &str,
        ngo_name: &str,
        ngo_needs: &str,
        distance_km: f64,
    ) -> Option<GroqEvaluation> {
        let api_key = self.api_key.as_ref()?;
        let prompt = format!(
            "Evalúa la compatibilidad logística entre esta donación y la organización social receptora.\n\n\
            DONACIÓN DISPONIBLE:\n- Producto: {}\n- Especificaciones: {}\n\n\
            ORGANIZACIÓN SOCIAL:\n- Nombre: {}\n- Necesidades urgentes: {}\n- Distancia en ruta: {:.1} km\n\n\
            Genera tu veredicto ÚNICAMENTE en JSON plano con la siguiente estructura:\n\
            {{\"compatibility_score\": <número entre 0 y 100>, \"reasoning\": \"<justificación de máximo 22 palabras>\", \"priority_level\": \"<Alta|Media|Baja>\"}}",
            donation_title, donation_desc, ngo_name, ngo_needs, distance_km
        );

        let body = serde_json::json!({
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "Eres un coordinador logístico de donaciones y ayuda comunitaria."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        });

        let res = self.client
            .post("https://api.groq.com/openai/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .ok()?;

        if !res.status().is_success() {
            return None;
        }

        let val: serde_json::Value = res.json().await.ok()?;
        let content = val["choices"][0]["message"]["content"].as_str()?;
        serde_json::from_str::<GroqEvaluation>(content).ok()
    }
}
