import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPositionCostsToLineup1772064003000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_lineups ADD COLUMN pg_cost INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE app_lineups ADD COLUMN sg_cost INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE app_lineups ADD COLUMN sf_cost INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE app_lineups ADD COLUMN pf_cost INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE app_lineups ADD COLUMN c_cost INT NOT NULL DEFAULT 0`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_lineups DROP COLUMN c_cost`);
    await queryRunner.query(`ALTER TABLE app_lineups DROP COLUMN pf_cost`);
    await queryRunner.query(`ALTER TABLE app_lineups DROP COLUMN sf_cost`);
    await queryRunner.query(`ALTER TABLE app_lineups DROP COLUMN sg_cost`);
    await queryRunner.query(`ALTER TABLE app_lineups DROP COLUMN pg_cost`);
  }
}
