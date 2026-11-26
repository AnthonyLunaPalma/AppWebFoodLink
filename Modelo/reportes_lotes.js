const supabase = require('../DB/DB_supabaseClient');

async function crearReporte({ pedidos_idpedidos, usuarios_idusuarios, motivo }) {
    const { data, error } = await supabase
        .from('reportes_lotes')
        .insert([{
            pedidos_idpedidos,
            usuarios_idusuarios,
            motivo
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

async function listarReportes() {
    const { data, error } = await supabase
        .from('reportes_lotes')
        .select(`
            idreporte,
            motivo,
            fecha_hora,
            pedidos_idpedidos,
            usuarios_idusuarios,
            pedidos:pedidos_idpedidos ( idpedidos, descripcion, peso, direccion_salida ),
            usuarios:usuarios_idusuarios ( idusuarios, nombre, cuenta )
        `)
        .order('idreporte', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

async function eliminarReporte(idreporte) {
    const { data, error } = await supabase
        .from('reportes_lotes')
        .delete()
        .eq('idreporte', idreporte)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0;
}

module.exports = { crearReporte, listarReportes, eliminarReporte };