const supabase = require('../DB/DB_supabaseClient');

const COLUMNAS_PUBLICAS = 'idusuarios, nombre, rol_idrol, cuenta, correo, estado_idestado';

// Consultar usuarios activos (con límite de 15 más recientes o filtrados por búsqueda)
async function listar(busqueda = '') {
    let query = supabase
        .from('usuarios')
        .select(COLUMNAS_PUBLICAS)
        .or('estado_idestado.eq.1,estado_idestado.is.null')
        .order('idusuarios', { ascending: false });

    if (busqueda && busqueda.trim() !== '') {
        query = query.ilike('cuenta', `%${busqueda.trim()}%`);
    } else {
        query = query.limit(15);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
}

// Consultar usuarios pendientes de validar (estado 2)
async function listarPendientes() {
    const { data, error } = await supabase
        .from('usuarios')
        .select(COLUMNAS_PUBLICAS)
        .eq('estado_idestado', 2)
        .order('idusuarios', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

// Aprobar usuario (cambiar estado a 1)
async function aprobar(idusuarios) {
    const { data, error } = await supabase
        .from('usuarios')
        .update({ estado_idestado: 1 })
        .eq('idusuarios', idusuarios)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0;
}

// Consultar por ID
async function obtenerPorId(idusuarios) {
    const { data, error } = await supabase
        .from('usuarios')
        .select(COLUMNAS_PUBLICAS)
        .eq('idusuarios', idusuarios)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;    
}

// Crear un usuario con estado por defecto 2 (Sin validar)
async function crear({ nombre, correo, cuenta, contrasena, rol_idrol }) {
    const { data, error } = await supabase
        .from('usuarios')
        .insert([{
            nombre,
            correo,
            cuenta,
            contrasena,
            rol_idrol,
            estado_idestado: 2
        }])
        .select('idusuarios')
        .single();

    if (error) throw new Error(error.message);
    return obtenerPorId(data.idusuarios);    
}

// Actualizar a un usuario
async function actualizar(idusuarios, { nombre, correo, cuenta, rol_idrol }) {
    const camposActualizar = {};
    if (nombre !== undefined) camposActualizar.nombre = nombre;
    if (correo !== undefined) camposActualizar.correo = correo;
    if (cuenta !== undefined) camposActualizar.cuenta = cuenta;
    if (rol_idrol !== undefined) camposActualizar.rol_idrol = rol_idrol;

    if (Object.keys(camposActualizar).length === 0) return obtenerPorId(idusuarios); 

    const { data, error } = await supabase
        .from('usuarios')
        .update(camposActualizar)
        .eq('idusuarios', idusuarios)
        .select();

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return undefined;
    return obtenerPorId(idusuarios);
}

// Eliminar un usuario
async function eliminar(idusuarios) {
    const { data, error } = await supabase
        .from('usuarios')
        .delete()
        .eq('idusuarios', idusuarios)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0;   
}

// Rechazar / eliminar solicitud pendiente
async function rechazar(idusuarios) {
    const { data, error } = await supabase
        .from('usuarios')
        .delete()
        .eq('idusuarios', idusuarios)
        .eq('estado_idestado', 2)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0;
}

// Buscar un usuario por cuenta
async function buscarPorCuentaConHash(cuenta) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cuenta', cuenta)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
}

module.exports = { 
    listar, 
    listarPendientes, 
    aprobar, 
    rechazar, 
    obtenerPorId, 
    crear, 
    actualizar, 
    eliminar, 
    buscarPorCuentaConHash 
};