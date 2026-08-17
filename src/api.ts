import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './theme';

const ACCESS = 'jiffit.customer.accessToken';
const REFRESH = 'jiffit.customer.refreshToken';

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS);
}

export async function setTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [ACCESS, accessToken],
    [REFRESH, refreshToken],
  ]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS, REFRESH]);
}

type ApiEnvelope<T> = { success: boolean; message: string; data: T; code?: string };

export async function api<T>(path: string, init: RequestInit = {}, authed = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (authed) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || `HTTP ${response.status}`) as Error & { code?: string; status?: number };
    error.code = payload.code;
    error.status = response.status;
    throw error;
  }
  return payload.data;
}
