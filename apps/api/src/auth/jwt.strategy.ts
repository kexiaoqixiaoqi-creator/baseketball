import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'supersecretkey_change_in_production',
    });
  }

  validate(payload: { sub: number; username: string; isAdmin: boolean }) {
    return { id: payload.sub, username: payload.username, isAdmin: payload.isAdmin };
  }
}
