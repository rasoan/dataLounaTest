
export const createTableUsersSqlRequest = `
      DROP TABLE IF EXISTS users CASCADE;
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        username VARCHAR(100) UNIQUE NOT NULL,
        -- допустим у каждого юзера по умолчанию на счету 100$ (убыточное предприятие получилось xD)
        balance DECIMAL(10, 2) NOT NULL DEFAULT 100
      );
`;

// todo: тестовым данным не место в проде, но ведь задание само - тестовое :)
export const insertTestUsersSqlRequest = `
    INSERT INTO users (username, balance) VALUES
    ('john_doe', 150.00),
    ('jane_doe', 200.00),
    ('admin', 300.00)
    ON CONFLICT (username) DO NOTHING;
`;

export const createTableItemsSqlRequest = `
      DROP TABLE IF EXISTS items CASCADE;
      CREATE TABLE IF NOT EXISTS items (
        id serial PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- todo: айтемы нужно сделать уникальными
        name VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL
      );
`;

export const createTablePurchasesSqlRequest = `
      DROP TABLE IF EXISTS purchases CASCADE;
      CREATE TABLE IF NOT EXISTS purchases (
        id serial PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- amount покупки это не тоже самое что и amount айтема, да могут совпадать, но это разные сущности
        amount DECIMAL(15,2) NOT NULL,
        user_id INT NOT NULL,
        item_id INT NOT NULL,
        CONSTRAINT fk_purchases__user_id FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_purchases__item_id FOREIGN KEY (item_id) REFERENCES items(id)
      );
`;

export const getUsersWithPurchasesSqlRequest = `
    SELECT 
        users.id AS user_id,
        users.username,
        users.balance,
        items.name AS item_name,
        purchases.amount AS purchase_amount,
        purchases.created_at AS purchase_date
    FROM 
        users
    INNER JOIN 
        purchases ON purchases.user_id = users.id
    INNER JOIN 
        items ON items.id = purchases.item_id;
`;
