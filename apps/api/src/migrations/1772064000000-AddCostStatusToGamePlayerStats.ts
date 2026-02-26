import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCostStatusToGamePlayerStats1772064000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE nba_game_player_stats ADD COLUMN cost INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE nba_game_player_stats ADD COLUMN status ENUM('prepare','playing','finish') NOT NULL DEFAULT 'prepare'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE nba_game_player_stats DROP COLUMN status`);
    await queryRunner.query(`ALTER TABLE nba_game_player_stats DROP COLUMN cost`);
  }
}
