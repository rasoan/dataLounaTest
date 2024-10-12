import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import {CacheModule} from "@nestjs/cache-manager";
import { redisStore } from 'cache-manager-redis-yet';
import {DatabaseService} from "./database/database.service";

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
        }),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    DatabaseService,
    AppService,
  ],
})
export class AppModule {}
