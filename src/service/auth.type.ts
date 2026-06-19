export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "CUSTOMER";
}

export interface LoginResponse {
  user: User;
  token: string;
}
