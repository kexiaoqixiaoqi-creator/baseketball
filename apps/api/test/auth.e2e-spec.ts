import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ensureDatabase } from '../src/ensure-database';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    await ensureDatabase();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({ origin: ['http://localhost:5173'], credentials: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('POST /auth/register - 创建新用户', () => {
    const username = `e2e_user_${Date.now()}`;
    const email = `e2e_${Date.now()}@test.com`;
    const password = 'password123';

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, email, password })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
        expect(res.body.user).toMatchObject({
          username,
          email,
        });
        expect(res.body.user).toHaveProperty('id');
      });
  });

  it('POST /auth/register - 重复邮箱应返回 409', async () => {
    const username = `dup_${Date.now()}`;
    const email = `dup_${Date.now()}@test.com`;
    const password = 'password123';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, email, password })
      .expect(201);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: `${username}_2`, email, password })
      .expect(409)
      .expect((res) => {
        expect(res.body.message).toMatch(/already registered/i);
      });
  });

  it('POST /auth/register - 校验失败应返回 400', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'ab', email: 'invalid', password: '123' })
      .expect(400);
  });
});
