import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixGamePlayerStatsStatusColumn1772064001000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 将 status 从 ENUM('prepare','playing','finish') 改为 VARCHAR(20)，表示球员上场状态，默认 on
    await queryRunner.query(
      `ALTER TABLE nba_game_player_stats MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'on'`,
    );
    // 将已有的 'prepare' 默认值回填为 'on'
    await queryRunner.query(
      `UPDATE nba_game_player_stats SET status = 'on' WHERE status = 'prepare'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE nba_game_player_stats MODIFY COLUMN status ENUM('prepare','playing','finish') NOT NULL DEFAULT 'prepare'`,
    );
  }
}
