const { Pool } = require('pg');
const pool = new Pool({
  host: 'buscaycurra-db', port: 5432, database: 'buscaycurra',
  user: 'buscaycurra', password: process.env.DB_PASS, max: 2
});
(async () => {
  const {rows} = await pool.query("SELECT COUNT(DISTINCT company) as pending FROM \"JobListing\" WHERE (\"contactEmail\" IS NULL OR \"contactEmail\"='') AND company IS NOT NULL AND company!=''");
  const {rows: r2} = await pool.query("SELECT COUNT(*) as total FROM \"JobListing\" WHERE \"contactEmail\" IS NOT NULL AND \"contactEmail\"!=''");
  console.log('Pending companies (no email):', rows[0].pending);
  console.log('Total offers with email:', r2[0].total);
  await pool.end();
  setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); process.exit(1); });
