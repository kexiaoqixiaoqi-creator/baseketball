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

  // Migrate nba_games.status: scheduled→prepare, in_progress→playing, completed→finish
  const dbConn = await createConnection({
    host,
    port,
    user,
    password,
    database,
  });
  try {
    // 1. Expand enum to include both old and new values
    await dbConn.execute(
      `ALTER TABLE nba_games MODIFY status ENUM('scheduled','in_progress','completed','prepare','playing','finish') NOT NULL DEFAULT 'prepare'`,
    );
    // 2. Update existing rows to new values
    await dbConn.execute(`UPDATE nba_games SET status = 'prepare' WHERE status = 'scheduled'`);
    await dbConn.execute(`UPDATE nba_games SET status = 'playing' WHERE status = 'in_progress'`);
    await dbConn.execute(`UPDATE nba_games SET status = 'finish' WHERE status = 'completed'`);
    // 3. Shrink enum to new values only
    await dbConn.execute(`ALTER TABLE nba_games MODIFY status ENUM('prepare','playing','finish') NOT NULL DEFAULT 'prepare'`);
  } catch (e) {
    // Table may not exist, or migration already applied
  }

  // Migrate nba_game_days.status: pending→prepare, active→playing, completed→finish
  // Migrate nba_game_days -> app_game_days, nba_games.game_day_id -> nba_games.date
  try {
    const [tables] = (await dbConn.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('nba_game_days','app_game_days','nba_games')`,
      [database],
    )) as [Array<{ TABLE_NAME: string }>, unknown];
    const tableSet = new Set(tables.map((r) => r.TABLE_NAME));

    if (tableSet.has('nba_game_days') && !tableSet.has('app_game_days')) {
      await dbConn.execute(`RENAME TABLE nba_game_days TO app_game_days`);
    }

    const [cols] = (await dbConn.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'nba_games'`,
      [database],
    )) as [Array<{ COLUMN_NAME: string }>, unknown];
    const colSet = new Set(cols.map((r) => r.COLUMN_NAME));

    if (colSet.has('game_day_id') && !colSet.has('date')) {
      await dbConn.execute(`ALTER TABLE nba_games ADD COLUMN date DATE NULL`);
      await dbConn.execute(
        `UPDATE nba_games g INNER JOIN app_game_days gd ON g.game_day_id = gd.id SET g.date = gd.date`,
      );
      await dbConn.execute(`ALTER TABLE nba_games MODIFY date DATE NOT NULL`);
      const [fks] = (await dbConn.execute(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'nba_games' AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [database],
      )) as [Array<{ CONSTRAINT_NAME: string }>, unknown];
      for (const row of fks) {
        await dbConn.execute(`ALTER TABLE nba_games DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
      }
      await dbConn.execute(`ALTER TABLE nba_games DROP COLUMN game_day_id`);
    } else if (!colSet.has('date')) {
      await dbConn.execute(`ALTER TABLE nba_games ADD COLUMN date DATE NOT NULL`);
    }
  } catch (e) {
    // Migration may partially apply
  }

  try {
    await dbConn.execute(
      `ALTER TABLE app_game_days MODIFY status ENUM('pending','active','completed','prepare','playing','finish') NOT NULL DEFAULT 'prepare'`,
    );
    await dbConn.execute(`UPDATE app_game_days SET status = 'prepare' WHERE status = 'pending'`);
    await dbConn.execute(`UPDATE app_game_days SET status = 'playing' WHERE status = 'active'`);
    await dbConn.execute(`UPDATE app_game_days SET status = 'finish' WHERE status = 'completed'`);
    await dbConn.execute(`ALTER TABLE app_game_days MODIFY status ENUM('prepare','playing','finish') NOT NULL DEFAULT 'prepare'`);
  } catch (e) {
    // Table may not exist, or migration already applied
  }

  // Migrate nba_player_season_stats: drop cost and fantasy_score columns
  try {
    await dbConn.execute(`ALTER TABLE nba_player_season_stats DROP COLUMN fantasy_score`);
  } catch (e) {
    // Column may not exist
  }
  try {
    await dbConn.execute(`ALTER TABLE nba_player_season_stats DROP COLUMN cost`);
  } catch (e) {
    // Column may not exist
  }

  // Migrate app_rooms: add salary_cap_coefficient
  try {
    await dbConn.execute(
      `ALTER TABLE app_rooms ADD COLUMN salary_cap_coefficient FLOAT NOT NULL DEFAULT 0.33`,
    );
  } catch (e) {
    // Column may already exist
  }

  // Migrate app_game_days: add room_id (关联默认 room，默认官方房间)
  try {
    await dbConn.execute(
      `ALTER TABLE app_game_days ADD COLUMN room_id INT NULL`,
    );
  } catch (e) {
    // Column may already exist
  }

  // Migrate app_rooms: drop salary_cap，仅保留 salary_cap_coefficient
  try {
    await dbConn.execute(`ALTER TABLE app_rooms DROP COLUMN salary_cap`);
  } catch (e) {
    // Column may not exist
  }
  await dbConn.end();
}
