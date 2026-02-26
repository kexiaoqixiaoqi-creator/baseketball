import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as entities from '@fantasy-nba/db';

// 加载环境变量（CLI 独立运行时 NestJS ConfigModule 不可用）
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
});

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'fantasy_nba',
  entities: Object.values(entities),
  migrations: [path.join(__dirname, 'migrations', '*.ts')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});

export default AppDataSource;
