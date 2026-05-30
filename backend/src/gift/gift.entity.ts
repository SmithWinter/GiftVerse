import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Gift {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column()
  @ApiProperty()
  brand: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty()
  value: number;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  description?: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  imageUrl?: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}
