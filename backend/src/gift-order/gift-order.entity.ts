import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Gift } from '../gift/gift.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum GiftOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  OPENED = 'opened',
  REDEEMED = 'redeemed',
}

@Entity()
export class GiftOrder {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ nullable: true })
  recipientName?: string;

  @ApiProperty()
  @Column()
  recipientContact: string;

  @ApiProperty()
  @Column()
  occasion: string;

  @ApiProperty()
  @Column('text')
  message: string;

  @ApiProperty()
  @Column()
  mood: string;

  @ApiProperty()
  @Column({ nullable: true })
  intent?: string;

  @ApiProperty()
  @Column('text', { nullable: true })
  detail?: string;

  @ApiProperty()
  @Column()
  generationMethod: string;

  @ApiProperty()
  @Column({ default: 0 })
  imageCount: number;

  @ApiProperty()
  @Column('text', { nullable: true })
  promptInput?: string;

  @ApiProperty()
  @Column('text', { nullable: true })
  promptFinal?: string;

  @ApiProperty()
  @Column()
  redeemCode: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: GiftOrderStatus,
    default: GiftOrderStatus.DRAFT,
  })
  status: GiftOrderStatus;

  @ApiProperty()
  @Column({ nullable: true })
  videoUrl?: string;

  @ApiProperty()
  @Column({ type: 'simple-array', nullable: true })
  imageUrls?: string[];

  @ApiProperty()
  @ManyToOne(() => Gift, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  gift: Gift;

  @ApiProperty()
  @Column()
  giftId: number;

  @ApiProperty()
  @ManyToOne(() => User, (user) => user.giftOrders, { onDelete: 'CASCADE' })
  giver: User;

  @ApiProperty()
  @Column()
  giverId: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
