import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decode } from '@auth/core/jwt';

/** Payload del JWT de Auth.js (DefaultJWT) */
export interface AuthJsJwtPayload {
  sub?: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  exp?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

const DEFAULT_SALT = 'authjs.session-token';

@Injectable()
export class AuthJsService {
  private readonly secret: string;
  private readonly salt: string;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('AUTH_SECRET') ?? '';
    this.salt = this.config.get<string>('AUTH_JWT_SALT') ?? DEFAULT_SALT;
    if (!this.secret) {
      console.warn('AUTH_SECRET no configurado; sesión con Auth.js no funcionará.');
    }
  }

  /**
   * Decodifica el JWT emitido por Auth.js (Next.js con getToken(), etc.)
   * y devuelve el payload. Auth.js usa JWE (A256CBC-HS512) por defecto.
   */
  async verifyToken(accessToken: string): Promise<AuthJsJwtPayload> {
    if (!this.secret) throw new UnauthorizedException('Auth con Auth.js no configurado');
    const payload = await decode({
      token: accessToken,
      secret: this.secret,
      salt: this.salt,
    });
    if (!payload || !payload.sub) throw new UnauthorizedException('Token inválido o expirado');
    return payload as AuthJsJwtPayload;
  }
}
