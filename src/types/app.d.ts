export interface ISkinportRaw {
    "market_hash_name": string;
    "currency": string;
    "suggested_price": number;
    "item_page": string;
    "market_page": string;
    "min_price": number;
    "max_price": number;
    "mean_price": number;
    "quantity": number;
    "created_at": number;
    "updated_at": number;
}

export type ISkinportsListRaw = ISkinportRaw[];

export interface ISkinport extends ISkinportRaw {
    "min_price_not_tradable": number | null;
}

export type ISkinportsList = ISkinport[];

export interface IBuySkinportMethodOptions {
    userId: number;
    market_hash_name: string;
}
