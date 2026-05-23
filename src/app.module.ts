import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller'; // Ensure this is imported
import { AppService } from './app.service';

@Module({
  imports: [ TypeOrmModule ],
  controllers: [AppController],
  providers: [AppService],
})

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Explicitly look for this file
    }),
    
    // 2. Use forRootAsync to wait for ConfigModule
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        console.log("Connecting to:", url); // Debugging step: check the logs
        return {
          type: 'postgres',
          url: url,
          ssl: {
            rejectUnauthorized: false, // Required for Neon cloud connections
          },
          synchronize: false,
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class AppModule {}