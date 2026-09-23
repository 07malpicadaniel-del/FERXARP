const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- TIPOS Y MODELOS ---

export interface AuthResponse {
  token: string;
}

export interface UserClaims {
  sub: string;
  role: "admin" | "empresa" | "ong";
  exp: number;
}

export interface DonationItem {
  id: string;
  user_id?: string | null;
  title: string;
  description?: string | null;
  quantity: number;
  status?: string | null;
}

export interface ScoredMatch {
  ngo_id: string;
  ngo_name: string;
  final_score: number;
  distance_km: number;
  semantic_similarity: number;
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
  point_type: "acopio" | "ong";
  latitude: number;
  longitude: number;
  status?: string | null;
  details: string;
}

// --- CLIENTE BASE HTTP ---

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fexarp_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error HTTP ${res.status}`);
  }

  return res.json();
}

// --- SERVICIOS DE LA API ---

export const api = {
  // Autenticación y Perfil
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; role: string }) =>
    request<string>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<UserClaims>("/api/auth/me"),

  // Donaciones y Matching Semántico
  createDonation: (data: { title: string; description?: string; quantity: number }) =>
    request<DonationItem>("/api/donations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listDonations: () => request<DonationItem[]>("/api/donations"),

  getMatches: (donationId: string) =>
    request<ScoredMatch[]>(`/api/donations/${donationId}/matches`),

  // Logística, Trazabilidad y Escaneo
  scanItem: (data: { donation_id: string; action: "entrada" | "salida" | "entrega" }) =>
    request<ScanResult>("/api/scanner/scan", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTracking: (id: string) =>
    request<DonationItem>(`/api/scanner/tracking/${id}`),

  // Geolocalización
  getMapPoints: () => request<MapPoint[]>("/api/scanner/map-points"),
};
