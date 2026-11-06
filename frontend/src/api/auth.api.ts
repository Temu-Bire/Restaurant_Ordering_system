import api from './axios';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from '../types';

export const registerRequest = async (data: RegisterPayload) => {
  const res = await api.post<User>('/auth/register', data);
  return res.data;
};

export const loginRequest = async (data: LoginPayload) => {
  const res = await api.post<LoginResponse>('/auth/login', data);
  return res.data;
};

export const meRequest = async () => {
  const res = await api.get<User>('/auth/me');
  return res.data;
};

export const logoutRequest = async () => {
  await api.post('/auth/logout');
};