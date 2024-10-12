#Инструкция запуска проекта

1. запустите Redis контейнер в Docker если он не установлен глобально 
```bash
docker run -d -p 6379:6379 redis
```
2. запустите контейнер в Docker c postgress если он у вас не запущен
```bash
docker run --name test_dataLouna -e POSTGRES_USER=test_dataLouna -e POSTGRES_PASSWORD=123 -e POSTGRES_DB=db -p 5433:5432 -d postgres
```
3. в корне проекта
```bash
pnpm install
```
4. в корне проекта
```bash
pnpm run start
```
5. тестовый запрос для получения списка айтемов (задание 1)
```
GET http://localhost:3000/skinportsList
```
6. тестовая покупка айтема (задание 2)
```
POST http://localhost:3000/buySkinport

BODY
{
    "market_hash_name": "2020 RMR Contenders",
    "userId": 1
}
```
7. список покупок (задание 2 (для удобства отладки))
```
GET http://localhost:3000/getAllUsersWithPurchases
```
