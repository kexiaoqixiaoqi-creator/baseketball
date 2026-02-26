import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCostFromGamePlayerStats1772064002000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE nba_game_player_stats DROP COLUMN cost`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE nba_game_player_stats ADD COLUMN cost INT NOT NULL DEFAULT 0`,
    );
  }
}
