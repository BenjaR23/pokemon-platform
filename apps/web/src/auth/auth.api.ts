import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from './auth.types';

const API_URL = 'http://localhost:3000';

export async function register(
  input: RegisterInput,
): Promise<AuthUser> {
  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json() as Promise<AuthUser>;
}

export async function login(
  input: LoginInput,
): Promise<AuthUser> {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json() as Promise<AuthUser>;
}

export async function logout(): Promise<void> {
  const response = await fetch(
    `${API_URL}/auth/logout`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      credentials: 'include',
    },
  );

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json() as Promise<AuthUser>;
}

async function getErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }

    return body.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}