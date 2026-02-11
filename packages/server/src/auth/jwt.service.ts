import jwt from 'jsonwebtoken';
import type { Config } from '../config.js';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export class JwtService {
  constructor(private readonly config: Pick<Config, 'JWT_SECRET' | 'JWT_EXPIRY'>) {}

  sign(payload: { sub: string; email: string }): string {
    return jwt.sign(payload, this.config.JWT_SECRET, {
      expiresIn: this.config.JWT_EXPIRY,
    } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.config.JWT_SECRET) as JwtPayload;
  }
}
