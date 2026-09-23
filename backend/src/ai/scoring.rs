// backend/src/ai/scoring.rs

/// Calcula la distancia en kilómetros entre dos coordenadas geográficas usando la fórmula de Haversine.
pub fn calculate_haversine_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const EARTH_RADIUS_KM: f64 = 6371.0;

    let d_lat = (lat2 - lat1).to_radians();
    let d_lon = (lon2 - lon1).to_radians();

    let a = (d_lat / 2.0).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos() * (d_lon / 2.0).sin().powi(2);

    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());

    EARTH_RADIUS_KM * c
}

/// Calcula el puntaje de prioridad total (0.0 a 100.0) combinando similitud semántica,
/// proximidad geográfica y urgencia.
///
/// - `similarity`: Similitud del matcher (0.0 a 1.0)
/// - `distance_km`: Distancia calculada en kilómetros
/// - `max_distance_km`: Radio máximo de cobertura para normalizar (ej. 50.0 km)
/// - `urgency_level`: Nivel de urgencia declarado por la ONG (1 a 5)
pub fn calculate_match_score(
    similarity: f64,
    distance_km: f64,
    max_distance_km: f64,
    urgency_level: u8,
) -> f64 {
    // 1. Normalizar factor de proximidad (1.0 = misma ubicación, 0.0 = fuera de radio)
    let proximity_factor = if distance_km >= max_distance_km {
        0.0
    } else {
        (1.0 - (distance_km / max_distance_km)).clamp(0.0, 1.0)
    };

    // 2. Normalizar urgencia (1-5 -> 0.2 a 1.0)
    let urgency_factor = (urgency_level as f64 / 5.0).clamp(0.2, 1.0);

    // 3. Ponderaciones: 50% similitud semántica, 30% urgencia, 20% cercanía geográfica
    let weight_similarity = 0.50;
    let weight_urgency = 0.30;
    let weight_proximity = 0.20;

    let raw_score = (similarity * weight_similarity)
        + (urgency_factor * weight_urgency)
        + (proximity_factor * weight_proximity);

    // Escalar a rango 0 - 100
    (raw_score * 100.0).clamp(0.0, 100.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_haversine_same_point() {
        let dist = calculate_haversine_distance(19.1738, -96.1342, 19.1738, -96.1342);
        assert!(dist < 0.001);
    }

    #[test]
    fn test_scoring_high_priority() {
        // Alta similitud (0.9), muy cerca (2 km sobre 50 km máx), máxima urgencia (5)
        let score = calculate_match_score(0.9, 2.0, 50.0, 5);
        assert!(score > 85.0);
    }
}
