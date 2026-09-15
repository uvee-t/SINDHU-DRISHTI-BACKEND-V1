import pg from "pg";
const { Pool } = pg;
const postgresPool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: Number(process.env.DB_PORT),
});
postgresPool.on("error", (err) => {
	console.log(`Postgres error: ${err}`);
});
const connectPostgreSQL = async () => {
	await postgresPool.query("SELECT 1");
	console.log("PostgreSQL Connected!");

	return postgresPool;
};

export { postgresPool, connectPostgreSQL };
