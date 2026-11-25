const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer();

const supabase = require('./DB/DB_supabaseClient');
const { crear, buscarPorCuentaConHash, listar, listarPendientes, aprobar, rechazar, eliminar } = require('./Modelo/usuarios');
const { crearLote } = require('./Modelo/pedidos');
const { validarCorreo } = require('./src/validaciones');

const app = express();
app.use(express.json());
app.use(cors());

// Obtener envíos/rutas asignadas por usuario voluntario
app.get('/api/envios', async (req, res) => {
    try {
        const { usuarios_idusuarios } = req.query;

        let query = supabase
            .from('envio') // <--- Cambiado de 'envios' a 'envio'
            .select('*');

        if (usuarios_idusuarios) {
            query = query.eq('usuarios_idusuarios', usuarios_idusuarios);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        res.json(data || []);
    } catch (error) {
        console.error('Error al obtener los envíos:', error);
        res.status(500).json({ error: 'Error al obtener los envíos del voluntario.' });
    }
});

// ==========================================
// RUTAS DE PEDIDOS / LOTES
// ==========================================

/// Obtener todos los pedidos (incluyendo receptor_idusuarios para los filtros de sesión)
app.get('/api/pedidos', async (req, res) => {
    try {
        const { usuarios_idusuarios, fecha } = req.query;

        let query = supabase
            .from('pedidos')
            .select(`
                idpedidos, 
                descripcion, 
                caducidad, 
                evaluador, 
                peso, 
                direccion_salida, 
                status_idstatus, 
                tipos_idtipos, 
                usuarios_idusuarios,
                receptor_idusuarios,
                usuarios:usuarios_idusuarios ( cuenta )
            `);

        if (usuarios_idusuarios) {
            query = query.eq('usuarios_idusuarios', usuarios_idusuarios);
        }

        if (fecha && fecha.trim() !== '') {
            const f = fecha.trim();
            query = query
                .gte('caducidad', `${f}T00:00:00`)
                .lte('caducidad', `${f}T23:59:59`);
        }

        // Ordenar de forma descendente por ID (los más recientes primero)
        query = query.order('idpedidos', { ascending: false });

        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        const rows = data.map(p => ({
            ...p,
            cuenta_usuario: p.usuarios ? p.usuarios.cuenta : 'Desconocida'
        }));

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({ error: 'Error al obtener los lotes.' });
    }
});

// Registrar nuevo lote
app.post('/api/pedidos', upload.single('foto'), async (req, res) => {
    try {
        const { descripcion, caducidad, evaluador, tipo, tipos_idtipos, pesoKg, direccionSalida, usuarios_idusuarios } = req.body;

        const idUsuarioLimpio = parseInt(usuarios_idusuarios, 10);
        
        if (!descripcion || !caducidad || !evaluador || (!tipo && !tipos_idtipos) || !pesoKg || !direccionSalida || isNaN(idUsuarioLimpio)) {
            return res.status(400).json({ error: 'Faltan campos obligatorios o el ID de usuario es inválido (NaN).' });
        }

        let idTipoFinal = tipos_idtipos ? Number(tipos_idtipos) : 1;
        if (tipo && !tipos_idtipos) {
            const mapaTipos = {
                'Lácteos y derivados': 1, 'Carnes, pescados y huevos': 2,
                'Legumbres, frutos secos y semillas': 3, 'Verduras y hortalizas': 4,
                'Frutas': 5, 'Cereales y tuberculos': 6,
                'Grasas y aceites': 7, 'Azucar, sal, condimentos y dulces': 8
            };
            idTipoFinal = mapaTipos[tipo] || 1;
        }

        const nuevoLote = await crearLote({
            descripcion,
            caducidad,
            evaluador,
            tipos_idtipos: idTipoFinal,
            peso: parseFloat(pesoKg),
            direccion_salida: direccionSalida,
            usuarios_idusuarios: idUsuarioLimpio
        });

        res.status(201).json({
            mensaje: '¡Lote publicado con éxito!',
            lote: nuevoLote
        });

    } catch (error) {
        console.error('Error al guardar el lote:', error);
        res.status(500).json({ error: 'Error en el servidor al registrar el lote.' });
    }
});

// Aceptar lote (Cambia estatus a 2 y guarda el ID del receptor en la BD)
app.post('/api/pedidos/:id/aceptar', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarios_idusuarios } = req.body; // Recibimos el ID del receptor

        const { data: loteActual, error: errorBusqueda } = await supabase
            .from('pedidos')
            .select('status_idstatus')
            .eq('idpedidos', id)
            .single();

        if (errorBusqueda || !loteActual) {
            return res.status(404).json({ error: 'Lote no encontrado.' });
        }

        if (Number(loteActual.status_idstatus) !== 1) {
            return res.status(400).json({ error: 'Lo sentimos, este lote ya ha sido aceptado por otro receptor.' });
        }

        const { data, error } = await supabase
            .from('pedidos')
            .update({ 
                status_idstatus: 2, 
                receptor_idusuarios: usuarios_idusuarios 
            })
            .eq('idpedidos', id)
            .select();

        if (error) throw new Error(error.message);
        res.json({ mensaje: '¡Lote aceptado con éxito!', lote: data[0] });
    } catch (error) {
        console.error('Error al aceptar lote:', error);
        res.status(500).json({ error: 'Error en el servidor al aceptar el lote.' });
    }
});

// Cancelar lote (Regresa a estatus 1 y limpia el receptor_idusuarios)
app.post('/api/pedidos/:id/cancelar', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('pedidos')
            .update({ 
                status_idstatus: 1, 
                receptor_idusuarios: null 
            })
            .eq('idpedidos', id)
            .select();

        if (error) throw new Error(error.message);
        res.json({ mensaje: '¡Lote cancelado con éxito!', lote: data[0] });
    } catch (error) {
        console.error('Error al cancelar lote:', error);
        res.status(500).json({ error: 'Error en el servidor al cancelar el lote.' });
    }
});

// ==========================================
// RUTAS DE USUARIOS Y AUTENTICACIÓN
// ==========================================

app.post('/api/registro', async (req, res) => {
    try {
        const { rol, nombre, correo, cuenta, contrasena } = req.body;

        if (!rol || !nombre || !correo || !cuenta || !contrasena) {
            return res.status(400).json({ error: 'Faltan campos obligatorios.' });
        }

        if (!validarCorreo(correo)) {
            return res.status(400).json({ error: 'El formato del correo electrónico no es válido.' });
        }

        let rol_idrol = 1;
        if (rol === 'Donador') rol_idrol = 1;
        else if (rol === 'Receptor') rol_idrol = 2;
        else if (rol === 'Voluntario') rol_idrol = 3;

        const nuevoUsuario = await crear({ nombre, correo, cuenta, contrasena, rol_idrol });

        res.status(201).json({ 
            mensaje: '¡Cuenta registrada con éxito!', 
            usuario: nuevoUsuario 
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al registrar el usuario.' });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const { busqueda } = req.query;
        const usuarios = await listar(busqueda);
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ error: 'Error al obtener los usuarios.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { cuenta, contrasena } = req.body;

        if (!cuenta || !contrasena) {
            return res.status(400).json({ error: 'Faltan la cuenta y la contraseña.' });
        }

        const usuario = await buscarPorCuentaConHash(cuenta);

        if (!usuario || usuario.contrasena !== contrasena) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        if (Number(usuario.estado_idestado) !== 1) {
            return res.status(403).json({ error: 'El administrador todavía no los acepta.' });
        }

        res.json({
            mensaje: '¡Inicio de sesión exitoso!',
            usuario: {
                idusuarios: usuario.idusuarios,
                nombre: usuario.nombre,
                cuenta: usuario.cuenta,
                rol_idrol: usuario.rol_idrol,
                estado_idestado: usuario.estado_idestado
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
    }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exito = await eliminar(id);
        if (!exito) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ mensaje: '¡Usuario eliminado con éxito!' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
});

app.get('/api/usuarios/pendientes', async (req, res) => {
    try {
        const pendientes = await listarPendientes();
        res.json(pendientes);
    } catch (error) {
        console.error('Error al obtener pendientes:', error);
        res.status(500).json({ error: 'Error al obtener usuarios pendientes.' });
    }
});

app.post('/api/usuarios/:id/aprobar', async (req, res) => {
    try {
        const { id } = req.params;
        const exito = await aprobar(id);
        if (!exito) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ mensaje: '¡Usuario aprobado con éxito!' });
    } catch (error) {
        console.error('Error al aprobar usuario:', error);
        res.status(500).json({ error: 'Error al aprobar el usuario.' });
    }
});

app.post('/api/usuarios/:id/rechazar', async (req, res) => {
    try {
        const { id } = req.params;
        const exito = await rechazar(id);
        if (!exito) {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }
        res.json({ mensaje: '¡Solicitud rechazada con éxito!' });
    } catch (error) {
        console.error('Error al rechazar usuario:', error);
        res.status(500).json({ error: 'Error al rechazar la solicitud.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});