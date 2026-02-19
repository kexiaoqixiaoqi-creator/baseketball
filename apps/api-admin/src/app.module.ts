import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from '@fantasy-nba/db';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { GameDaysModule } from './game-days/game-days.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        synchronize: true,
        logging: false,
      }),
    }),
    AuthModule,
    PlayersModule,
    GameDaysModule,
    RoomsModule,
    UsersModule,
    TeamsModule,
  ],
})
export class AppModule {}
