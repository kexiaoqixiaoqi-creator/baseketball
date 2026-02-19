import * as path from 'path';
import * as dotenv from 'dotenv';
import { createConnection } from 'mysql2/promise';

/** 应用启动前确保数据库存在（不指定 database 连接后执行 CREATE DATABASE） */
export async function ensureDatabase(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`) });

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_DATABASE || 'fantasy_nba';

  const conn = await createConnection({
    host,
    port,
    user,
    password,
  });
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await conn.end();
}
