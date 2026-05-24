import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchesModule } from './matches/matches.module';
import { AdvocatesModule } from './advocates/advocates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        synchronize: false,
        autoLoadEntities: true,
        extra: {
          max: 20, // Keep this lower to stay safe with Neon/Postgres limits
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      }),
    }),
    MatchesModule,
    AdvocatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}