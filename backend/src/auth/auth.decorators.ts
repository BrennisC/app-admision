import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedUser, UserRole } from "./auth.types";

export const IS_PUBLIC_KEY = "isPublic";
export const ROLES_KEY = "roles";

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    (context.switchToHttp().getRequest<Request>() as Request & { user: AuthenticatedUser }).user,
);
