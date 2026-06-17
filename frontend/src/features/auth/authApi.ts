import { api } from "../../api";
import type { User } from "../../api";

export async function login(login: string, password: string) {
  const data = new URLSearchParams();
  data.append("username", login);
  data.append("password", password);
  const response = await api.post<{ access_token: string; token_type: string }>("/auth/login", data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
}

export async function register(payload: {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}) {
  const response = await api.post<User>("/auth/register", payload);
  return response.data;
}

export async function me() {
  const response = await api.get<User>("/users/me");
  return response.data;
}

export async function requestVerification() {
  const response = await api.post("/auth/request-verify-token");
  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await api.post("/auth/verify", { token });
  return response.data as User;
}

export async function forgotPassword(email: string) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token: string, password: string) {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
}

export async function changePassword(old_password: string, new_password: string) {
  const response = await api.post("/auth/change-password", { old_password, new_password });
  return response.data;
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return response.data;
}
