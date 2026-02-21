import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '@fantasy-nba/db';

const ADMIN_EMAIL = 'admin@qq.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '12345678';

/** 首次部署时植入管理员种子：admin / admin@qq.com / 12345678 */
export async function seedAdminUser(app: INestApplication): Promise<void> {
  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const existing = await userRepo.findOne({ where: { email: ADMIN_EMAIL } });
    if (existing) return;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await userRepo.save(
      userRepo.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        passwordHash,
        isAdmin: true,
      }),
    );
    console.log(`[seed] Admin user created: ${ADMIN_EMAIL}`);
  } catch (e) {
    console.warn('[seed] Admin seed skipped:', (e as Error).message);
  }
}
