import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateGiftOrderWithGiftRelation1780128427689 implements MigrationInterface {
    name = 'UpdateGiftOrderWithGiftRelation1780128427689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gift_order\` DROP COLUMN \`voucherBrand\``);
        await queryRunner.query(`ALTER TABLE \`gift_order\` DROP COLUMN \`voucherValue\``);
        await queryRunner.query(`ALTER TABLE \`gift_order\` ADD \`giftId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`gift_order\` CHANGE \`recipientName\` \`recipientName\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`gift_order\` ADD CONSTRAINT \`FK_8eea500da35f4c66afcbebb39ce\` FOREIGN KEY (\`giftId\`) REFERENCES \`gift\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gift_order\` DROP FOREIGN KEY \`FK_8eea500da35f4c66afcbebb39ce\``);
        await queryRunner.query(`ALTER TABLE \`gift_order\` CHANGE \`recipientName\` \`recipientName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`gift_order\` DROP COLUMN \`giftId\``);
        await queryRunner.query(`ALTER TABLE \`gift_order\` ADD \`voucherValue\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`gift_order\` ADD \`voucherBrand\` varchar(255) NOT NULL`);
    }

}
