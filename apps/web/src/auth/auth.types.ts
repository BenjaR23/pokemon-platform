export interface AuthUser {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}