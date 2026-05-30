import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOccasion1780125000000 implements MigrationInterface {
    name = 'CreateOccasion1780125000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`occasion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        // Seed initial occasions
        await queryRunner.query(`INSERT INTO \`occasion\` (\`name\`, \`description\`) VALUES 
            ('Birthday', 'Birthday celebration'),
            ('Anniversary', 'Anniversary celebration'),
            ('Thank you', 'Thank you gift'),
            ('Congrats', 'Congratulations'),
            ('Just because', 'Just because gift')`);
        
        // Seed initial gifts
        await queryRunner.query(`INSERT INTO \`gift\` (\`brand\`, \`value\`, \`description\`) VALUES 
            ('Amazon', 25.00, 'Amazon gift card'),
            ('Amazon', 50.00, 'Amazon gift card'),
            ('Amazon', 100.00, 'Amazon gift card'),
            ('Starbucks', 10.00, 'Starbucks gift card'),
            ('Starbucks', 25.00, 'Starbucks gift card'),
            ('Netflix', 15.99, 'Netflix gift card'),
            ('Spotify', 9.99, 'Spotify gift card')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM \`gift\``);
        await queryRunner.query(`DELETE FROM \`occasion\``);
        await queryRunner.query(`DROP TABLE \`occasion\``);
    }
}
