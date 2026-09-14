import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from './auth.api';
import { AuthContext } from './AuthContext';
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from './auth.types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } finally {
        setLoading(false);
      }
    }

    void loadCurrentUser();
  }, []);

  async function login(input: LoginInput) {
    const authenticatedUser = await loginRequest(input);
    setUser(authenticatedUser);
  }

  async function register(input: RegisterInput) {
    await registerRequest(input);

    const authenticatedUser = await loginRequest({
      email: input.email,
      password: input.password,
    });

    setUser(authenticatedUser);
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}