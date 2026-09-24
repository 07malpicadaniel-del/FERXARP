const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- TIPOS Y CONTRATOS DE DATOS ---

export interface UserClaims {
  sub: string;
  email: string;
  role: "empresa" | "ong" | "admin" | "ceo";
  exp: number;
}

export interface DonationItem {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  quantity: number;
  status?: string | null;
  assigned_ngo_id?: string | null;
}

export interface FeedDonationItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  status: string;
  donor_email: string;
  created_at?: string;
}

export interface ScoredMatch {
  ngo_id: string;
  ngo_name: string;
  distance_km: number;
  semantic_similarity: number;
  final_score: number;
}

export interface ScanResult {
  donation_id: string;
  previous_status: string | null;
  new_status: string;
  message: string;
}

export interface MapPoint {
  id: string;
  name: string;
  point_type: string;
  latitude: number;
  longitude: number;
  status?: string;
  details: string;
}

export interface ImpactMetrics {
  total_donations: number;
  delivered_donations: number;
  in_transit_donations: number;
  rejected_donations: number;
  total_volume_kg: number;
  estimated_co2_saved_kg: number;
  estimated_beneficiaries: number;
  verified_ngos: number;
}

// --- CLIENTE HTTP CON GESTIÓN DE TOKEN Y RESPUESTAS NO-JSON ---

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fexarp_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP: ${response.status}`);
  }

  // Respuestas vacías (201 Created o 204 No Content sin cuerpo)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  // Fallback seguro si la respuesta llega en texto plano[cite: 18]
  const rawText = await response.text();
  return { message: rawText } as T;
}

// --- MÉTODOS DE CONSUMO DE LA API ---

export const api = {
  // Autenticación e Identidad[cite: 8]
  login: (data: { email: string; password: string }) =>
    request<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  register: (data: { email: string; password: string; role: string }) =>
    request<{ token: string; message: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  getMe: () => request<UserClaims>("/api/auth/me"),

  // Donaciones e Inventario[cite: 8]
  createDonation: (data: { title: string; description?: string; quantity: number }) =>
    request<DonationItem>("/api/donations", { method: "POST", body: JSON.stringify(data) }),

  listDonations: () => request<DonationItem[]>("/api/donations"),

  getMatches: (id: string) => request<ScoredMatch[]>(`/api/donations/${id}/matches`),

  // Flujo Operativo de ONGs[cite: 8]
  getDonationFeed: () => request<FeedDonationItem[]>("/api/donations/feed"),

  requestDonation: (donationId: string) =>
    request<void>(`/api/donations/${donationId}/request`, { method: "POST" }),

  // Logística, Trazabilidad y Geolocalización[cite: 8]
  scanItem: (data: { donation_id: string; action: string; rejection_reason?: string; notes?: string }) =>
    request<ScanResult>("/api/scanner/scan", { method: "POST", body: JSON.stringify(data) }),

  getMapPoints: () => request<MapPoint[]>("/api/scanner/map-points"),

  // Métricas del Tablero CEO (HU-3)[cite: 13]
  getImpactMetrics: () => request<ImpactMetrics>("/api/metrics/summary"),
};
