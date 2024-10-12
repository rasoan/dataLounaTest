'use strict';

import {Body, Controller, Get, Post} from '@nestjs/common';
import { AppService } from './app.service';
import {IBuySkinportMethodOptions, ISkinportsList} from "./types/app";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('skinportsList')
  getSkinportsList(): Promise<ISkinportsList> {
    return this.appService.getSkinportsList();
  }

  @Post('buySkinport')
  buySkinport(@Body() options: IBuySkinportMethodOptions) {
    return this.appService.buySkinport(options);
  }

  @Get('getAllUsersWithPurchases')
  getAllUsersWithPurchases() {
    return this.appService.getAllUsersWithPurchases();
  }
}
