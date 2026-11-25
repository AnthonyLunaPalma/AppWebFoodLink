const { Pool } = require('pg');

const pool = new Pool({
    host: 'db.mdhnpduzimbhrwyifdde.supabase.co', // El host que te muestra Supabase
    port: 5432,
    user: 'postgres',
    password: 'S!caRu19301302', // La contraseña que creaste al configurar tu base de datos
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;