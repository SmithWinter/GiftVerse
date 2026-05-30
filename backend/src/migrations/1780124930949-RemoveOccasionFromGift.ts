import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOccasionFromGift1780124930949 implements MigrationInterface {
    name = 'RemoveOccasionFromGift1780124930949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gift\` DROP COLUMN \`occasion\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gift\` ADD \`occasion\` enum ('birthday', 'anniversary', 'graduation', 'holiday', 'thank_you', 'other') NOT NULL DEFAULT 'other'`);
    }

}
