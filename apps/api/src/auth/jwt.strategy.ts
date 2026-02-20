import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@fantasy-nba/db';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'supersecretkey_change_in_production',
    });
  }

  async validate(payload: { sub: number; username: string; isAdmin: boolean }) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) return null;
    return { id: user.id, username: user.username, isAdmin: user.isAdmin };
  }
}
