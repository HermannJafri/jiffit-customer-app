import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearTokens, getAccessToken, setTokens } from './api';

export type Customer = {
  id: number;
  phone: string;
  name: string | null;
};

type AuthContextValue = {
  ready: boolean;
  customer: Customer | null;
  login: (phone: string, otp: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    void (async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          setCustomer(await api<Customer>('/auth/customer/me'));
        } catch {
          await clearTokens();
        }
      }
      setReady(true);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      customer,
      sendOtp: async (phone) => {
        await api('/auth/customer/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }, false);
      },
      login: async (phone, otp) => {
        const data = await api<{ accessToken: string; refreshToken: string; customer: Customer }>(
          '/auth/customer/verify-otp',
          { method: 'POST', body: JSON.stringify({ phone, otp }) },
          false,
        );
        await setTokens(data.accessToken, data.refreshToken);
        setCustomer(data.customer);
      },
      logout: async () => {
        await clearTokens();
        setCustomer(null);
      },
    }),
    [ready, customer],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider required');
  return ctx;
}
