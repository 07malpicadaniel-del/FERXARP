// frontend/src/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Utilidad base para peticiones con o sin autenticación
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
    throw new Error(errorText || `Error ${res.status}: Fallo en la petición`);
  }

  return res.json();
}

// --- AUTENTICACIÓN ---
export interface AuthResponse {
  token: string;
}

export interface UserClaims {
  sub: string;
  role: "admin" | "empresa" | "ong";
  exp: number;
}

export const api = {
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

  // --- DONACIONES ---
  createDonation: (data: { title: string; description?: string; quantity: number }) =>
    request<{ id: string; user_id: string; title: string; description?: string; quantity: number }>(
      "/api/donations",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  listDonations: () =>
    request<Array<{ id: string; user_id: string; title: string; description?: string; quantity: number }>>(
      "/api/donations"
    ),

  getMatches: (donationId: string) =>
    request<
      Array<{
        ngo_id: string;
        ngo_name: string;
        final_score: number;
        distance_km: number;
        semantic_similarity: number;
      }>
    >(`/api/donations/${donationId}/matches`),

    // --- LOGÍSTICA Y ESCANEO ---
  scanItem: (data: { donation_id: string; action: "entrada" | "salida" | "entrega" }) =>
    request<{ donation_id: string; previous_status: string | null; new_status: string; message: string }>(
      "/api/scanner/scan",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  getTracking: (id: string) =>
    request<{ id: string; title: string; quantity: number; status: string | null }>(
      `/api/scanner/tracking/${id}`
    ),
};
