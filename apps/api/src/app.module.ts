import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as entities from '@fantasy-nba/db';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { GameDaysModule } from './game-days/game-days.module';
import { LineupsModule } from './lineups/lineups.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { ScraperModule } from './scraper/scraper.module';

const isProduction = process.env.NODE_ENV === 'production';
/** 生产环境首次建表：设置 DB_SYNCHRONIZE=true 运行一次，建表完成后移除 */
const forceSync = process.env.DB_SYNCHRONIZE === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'fantasy_nba'),
        entities: Object.values(entities),
        synchronize: forceSync || !isProduction,
        logging: config.get('DB_LOGGING') === 'true',
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    PlayersModule,
    GameDaysModule,
    LineupsModule,
    RoomsModule,
    UsersModule,
    TeamsModule,
    ScraperModule,
  ],
})
export class AppModule {}
