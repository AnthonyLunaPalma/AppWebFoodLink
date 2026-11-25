// DB/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

// Reemplaza con tus credenciales reales de tu panel de Supabase
const SUPABASE_URL = 'https://mdhnpduzimbhrwyifdde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fvZj9XZXy583SIbJ-frHWA_FSLAcjNA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;