const supabase = require('../DB/DB_supabaseClient');

// Consultar envíos (con opción de filtrar por usuario voluntario)
async function listar(usuarios_idusuarios) {
    let query = supabase
        .from('envio') // <--- Cambiado aquí
        .select('*');

    if (usuarios_idusuarios) {
        query = query.eq('usuarios_idusuarios', usuarios_idusuarios);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
}

// Consultar por fecha
async function obtenerPorFecha(fecha) {
    const { data, error } = await supabase
        .from('envio') // <--- Cambiado aquí
        .select('*')
        .eq('fecha', fecha)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;    
}

// Crear un envío
async function crear({ usuarios_idusuarios, pedidos_idpedidos, direcciondestino, direccionsalida, fecha }) {
    const { data, error } = await supabase
        .from('envio') // <--- Cambiado aquí
        .insert([{
            usuarios_idusuarios,
            pedidos_idpedidos,
            direcciondestino,
            direccionsalida,
            fecha
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;    
}

// Eliminar un envío
async function eliminar(idenvio) {
    const { data, error } = await supabase
        .from('envio') // <--- Cambiado aquí
        .delete()
        .eq('idenvio', idenvio)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0;   
}

module.exports = { listar, obtenerPorFecha, crear, eliminar };