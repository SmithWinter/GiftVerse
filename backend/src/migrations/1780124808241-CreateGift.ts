import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGift1780124808241 implements MigrationInterface {
    name = 'CreateGift1780124808241'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`gift\` (\`id\` int NOT NULL AUTO_INCREMENT, \`brand\` varchar(255) NOT NULL, \`value\` decimal(10,2) NOT NULL, \`occasion\` enum ('birthday', 'anniversary', 'graduation', 'holiday', 'thank_you', 'other') NOT NULL DEFAULT 'other', \`description\` varchar(255) NULL, \`imageUrl\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`gift\``);
    }

}
