import { api } from "@/lib/api";
import type { LoginPayload, LoginResponse } from "./auth.type";

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const AuthService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/api/auth/admin/login", payload);
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/api/auth/change-password",
      payload,
    );
    return response.data;
  },
};
