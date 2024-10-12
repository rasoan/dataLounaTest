'use strict';

import {Inject, Injectable} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {AxiosResponse} from "axios";
import {lastValueFrom} from "rxjs";
import {ISkinport, IBuySkinportMethodOptions, ISkinportsList, ISkinportsListRaw} from "./types/app";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
// @ts-ignore
import { Cache } from 'cache-manager';
import {DatabaseService} from "./database/database.service";

const SKINPORTS_GET_LIMIT = 4;

@Injectable()
export class AppService {
  private _skinportsLimit = SKINPORTS_GET_LIMIT;
  private _skinportsLimitSetInterval?: ReturnType<typeof setInterval> = void 0;

  constructor(
      private readonly _httpService: HttpService,
      private readonly _databaseService: DatabaseService,
      @Inject(CACHE_MANAGER) private _cacheManager: Cache
  ) {}

  private _resetSkinportsLimit() {
    this._skinportsLimit = SKINPORTS_GET_LIMIT;
  }

  private async onModuleInit() {
    this._skinportsLimitSetInterval = setInterval(() => {
      this._resetSkinportsLimit();
    }, 5 * 60 * 1000)
  }

  private async onModuleDestroy() {
    clearInterval(this._skinportsLimitSetInterval);
  }

  public async getSkinportsList(): Promise<ISkinportsList> {
    const skinportsListKey = `skinports_list`;

    if (this._skinportsLimit <= 0) {
      const skinportsListFromCache = await this._cacheManager.get(skinportsListKey) as ISkinportsList | undefined;

      if (!skinportsListFromCache) {
        throw new Error("Can't get skinportsListFromCache!");
      }

      return skinportsListFromCache;
    }

    const skinportsListSourceTroudable = this._httpService.get(getTroudablesListUrl(1));
    const skinportsListSource = this._httpService.get(getTroudablesListUrl(0));

    let skinportsList: ISkinportsListRaw | undefined;
    let skinportsListTroudable: ISkinportsListRaw | undefined;

    try {
      skinportsList = (await lastValueFrom<AxiosResponse<ISkinportsListRaw>>(skinportsListSource)).data;
      skinportsListTroudable = (await lastValueFrom<AxiosResponse<ISkinportsListRaw>>(skinportsListSourceTroudable)).data;

      this._skinportsLimit--;
    }
    catch {
      return await this._cacheManager.get(skinportsListKey) as ISkinportsList | undefined;
    }

    const skinportsListResult = skinportsListRawToSkinportsList({
      skinportsList,
      skinportsListTroudable,
    });

    await this._cacheManager.set(skinportsListKey, skinportsListResult);

    return skinportsListResult;
  }

  public async buySkinport(options: IBuySkinportMethodOptions) {
    const skinportsList = await this.getSkinportsList();
    const targetSkinport = skinportsList.find(skinport => skinport.market_hash_name === options.market_hash_name);

    if (!targetSkinport) {
      throw new Error(`Can't build Skinport for ${options.market_hash_name}`);
    }

    const client = await this._databaseService.pool.connect();

    try {
      await client.query('BEGIN');

      const insertItemResult = await client.query<{
        id: number;
        created_at: string;
        name: string;
        amount: number;
      }>(
          `INSERT INTO items (name, amount) VALUES ($1, $2) RETURNING *`,
          [targetSkinport.market_hash_name, targetSkinport.min_price]
      );

      const [ item ] = insertItemResult.rows;

      const userQueryReslut = await client.query<{
        id: number;
        created_at: number;
        username: string;
        balance: number;
      }>(
          `SELECT * FROM users WHERE id = $1 FOR UPDATE`,
          [ options.userId ]
      );

      const [ user ] = userQueryReslut.rows;

      if (!user) {
        throw new Error(`No user!`);
      }

      if (user.balance < targetSkinport.min_price) {
        throw new Error('Not enough balance to complete the purchase');
      }

      const insertPurchaseResult = await client.query<{
        id: number;
        created_at: number;
        amount: number;
        user_id: number;
        item_id: number;
      }>(
          `INSERT INTO purchases (user_id, item_id, amount) VALUES ($1, $2, $3) RETURNING *`,
          [options.userId, item.id, targetSkinport.min_price]
      );

      await client.query(
          `UPDATE users SET balance = balance - $1 WHERE id = $2`,
          [targetSkinport.min_price, options.userId]
      );

      await client.query('COMMIT');

      const newPurchase = insertPurchaseResult.rows[0];

      return {
        success: true,
        message: 'Purchase and item creation completed successfully',
        purchase: {
          purchase_id: newPurchase.id,
          user: {
            id: user.id,
            username: user.username,
            // todo: это значение лучше вытаскивать повторно из таблицы для надежности, а не вычислять здесь
            remaining_balance: user.balance - targetSkinport.min_price
          },
          item: {
            id: item.id,
            name: item.name,
            price: item.amount
          },
          purchase_amount: newPurchase.amount,
          purchase_date: newPurchase.created_at
        }
      };
    }
    catch (error) {
      await client.query('ROLLBACK');

      throw error;
    } finally {
      client.release();
    }
  }

  public getAllUsersWithPurchases() {
    return this._databaseService.getAllUsersWithPurchases();
  }
}

function getTroudablesListUrl(tradable: 1 | 0) {
  return `https://api.skinport.com/v1/items?tradable=${tradable}`;
}

function skinportsListRawToSkinportsList(options: {
  skinportsList: ISkinportsListRaw;
  skinportsListTroudable: ISkinportsListRaw;
}): ISkinportsList {
  const {
    skinportsList,
    skinportsListTroudable,
  } = options;

  return skinportsListTroudable.map((skinport: ISkinport) => {
    const skinportNotTradable = skinportsList.find(
        skinportNotTradable => skinportNotTradable.market_hash_name === skinport.market_hash_name,
    );

    return {
      ...skinport,
      // В теории айтема может не оказаться и тогда надо решить - делать throw Error или просто отдать null, я решил отдать null и не ломать
      min_price_not_tradable: skinportNotTradable?.min_price ?? null,
    }
  })
}
