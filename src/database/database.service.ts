import {Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {
    createTableItemsSqlRequest,
    createTablePurchasesSqlRequest,
    createTableUsersSqlRequest, getUsersWithPurchasesSqlRequest,
    insertTestUsersSqlRequest
} from "./constants";

@Injectable()
export class DatabaseService {
    public pool: Pool;

    private async onModuleInit() {
        this.pool = new Pool({
            user: 'test_dataLouna',
            host: 'localhost',
            database: 'db',
            password: '123',
            port: 5433,
        });

        await this._createTablesIfNotExists();
        await this._insertTestUsers();
    }

    private async _createTablesIfNotExists() {
        await this.pool.query(createTableUsersSqlRequest);
        await this.pool.query(createTableItemsSqlRequest);
        await this.pool.query(createTablePurchasesSqlRequest);
    }

    /**
     * наполним таблицу тестовыми юзерами
    */
    private async _insertTestUsers() {
        await this.pool.query(insertTestUsersSqlRequest);
    }

    public query(queryText: string, params?: any[]) {
        return this.pool.query(queryText, params);
    }

    public async getAllUsersWithPurchases() {
        return (await this.query(getUsersWithPurchasesSqlRequest)).rows;
    }
}
