import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GiftOrder } from '../gift-order/gift-order.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ unique: true })
  @ApiProperty()
  email: string;

  @Column()
  password: string;

  @Column()
  @ApiProperty()
  fullName: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @OneToMany(() => GiftOrder, (giftOrder) => giftOrder.giver)
  giftOrders: GiftOrder[];
}
