import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { GiftModule } from './gift/gift.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { VideoProcessorModule } from './video-processor/video-processor.module';
import { User } from './user/user.entity';
import { Gift } from './gift/gift.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Gift],
        synchronize: false,
        migrations: ['dist/migrations/*.js'],
        ssl: {
          rejectUnauthorized: false,
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    GiftModule,
    CloudinaryModule,
    VideoProcessorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
