export type UserRole = "ADMIN" | "ADMISION" | "TESORERIA" | "CAJERO" | "CONSULTA";

export interface AuthenticatedUser {
  sub: number;
  username: string;
  name: string;
  role: UserRole;
}
