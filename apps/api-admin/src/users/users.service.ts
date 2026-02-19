import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@fantasy-nba/db';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  findAll() {
    return this.userRepo.find({
      select: ['id', 'username', 'email', 'isAdmin', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }
}
