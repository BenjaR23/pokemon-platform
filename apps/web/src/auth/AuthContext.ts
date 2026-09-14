import { createContext } from 'react';
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from './auth.types';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );