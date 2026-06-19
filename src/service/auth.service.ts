import { api } from "@/lib/api";
import type { LoginPayload, LoginResponse } from "./auth.type";

export const AuthService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/api/auth/admin/login", payload);
    return response.data;
  },
};
