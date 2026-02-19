import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '@fantasy-nba/db';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.isAdmin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    const payload = { sub: user.id, username: user.username, isAdmin: user.isAdmin };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin },
    };
  }
}
