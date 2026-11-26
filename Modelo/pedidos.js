const supabase = require('../DB/DB_supabaseClient');

async function crearLote({ descripcion, caducidad, evaluador, tipos_idtipos, peso, direccion_salida, usuarios_idusuarios }) {
    const { data, error } = await supabase
        .from('pedidos')
        .insert([{
            descripcion,
            caducidad,
            evaluador,
            status_idstatus: 1,
            tipos_idtipos,
            peso,
            direccion_salida,
            usuarios_idusuarios
        }])
        .select('idpedidos')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

async function eliminarLote(idpedidos) {
    const { data, error } = await supabase
        .from('pedidos')
        .delete()
        .eq('idpedidos', idpedidos)
        .select();

    if (error) {
        throw new Error(error.message);
    }

    return data && data.length > 0;
}

module.exports = { crearLote, eliminarLote };  