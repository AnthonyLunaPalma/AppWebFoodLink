document.addEventListener('DOMContentLoaded', async () => {
    // MOSTRAR EL NOMBRE DE LA CUENTA ACTIVA EN EL ENCABEZADO
    const usuarioActivo = obtenerSesion();
    const spanUsuario = document.getElementById('texto-usuario');

    if (usuarioActivo && spanUsuario) {
        spanUsuario.textContent = `👤 ${usuarioActivo.nombre} (${usuarioActivo.cuenta})`;
        spanUsuario.style.fontWeight = 'bold';
        spanUsuario.style.color = '#5c3a40';
    }

    const formPublicar = document.getElementById('form-publicar');
    const mensajePublicar = document.getElementById('mensaje-publicar');
    const btnPublicar = document.getElementById('btn-publicar-lote');
    const contenedorLotes = document.getElementById('lista-lotes-donador');
    const checkDeslinde = document.getElementById('lote-deslinde');

    const STATUS_BD = {
        1: "Notificado al donador",
        2: "Aceptado",
        3: "Entregado al voluntario",
        4: "En camino",
        5: "Entregado al receptor"
    };

    const TIPOS_NOMBRES = {
        1: "Lácteos y derivados", 2: "Carnes, pescados y huevos",
        3: "Legumbres, frutos secos y semillas", 4: "Verduras y hortalizas",
        5: "Frutas", 6: "Cereales y tubérculos",
        7: "Grasas y aceites", 8: "Azúcares y dulces"
    };

    // Habilitar/deshabilitar botón según el checkbox del deslinde
    if (checkDeslinde && btnPublicar) {
        btnPublicar.disabled = !checkDeslinde.checked;
        checkDeslinde.addEventListener('change', () => {
            btnPublicar.disabled = !checkDeslinde.checked;
        });
    }

    // Función para cargar los lotes exclusivos de este usuario
    async function cargarEstadoLotes() {
        if (!contenedorLotes) return;
        try {
            contenedorLotes.innerHTML = '<p class="texto-descripcion">Cargando tus lotes...</p>';
            const lotes = await listarLotesDonador(); 

            contenedorLotes.innerHTML = '';

            if (!lotes || lotes.length === 0) {
                contenedorLotes.innerHTML = '<p class="texto-descripcion">No tienes lotes registrados en esta sesión.</p>';
                return;
            }

            const tabla = document.createElement('table');
            tabla.style.width = '100%';
            tabla.style.borderCollapse = 'collapse';
            
            const columnas = ['ID', 'Tipo', 'Descripción', 'Peso (Kg)', 'Caducidad', 'Estatus'];
            let ths = columnas.map(c => `<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ccc;">${c}</th>`).join('');
            tabla.innerHTML = `<thead><tr>${ths}</tr></thead><tbody></tbody>`;
            
            const tbody = tabla.querySelector('tbody');

            lotes.forEach(l => {
                const fila = document.createElement('tr');
                const nombreTipo = TIPOS_NOMBRES[l.tipos_idtipos] || 'Desconocido';
                const nombreEstatus = STATUS_BD[l.status_idstatus] || 'Pendiente';
                const fechaCaducidad = l.caducidad ? new Date(l.caducidad).toLocaleString() : 'N/A';

                fila.innerHTML = `
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.idpedidos}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${nombreTipo}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.descripcion}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.peso} kg</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${fechaCaducidad}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #9d0208;">${nombreEstatus}</td>
                `;
                tbody.appendChild(fila);
            });

            contenedorLotes.appendChild(tabla);
        } catch (error) {
            contenedorLotes.innerHTML = `<p style="color: red;">Error al cargar los lotes: ${error.message}</p>`;
        }
    }

    if (formPublicar) {
        formPublicar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tipo = document.getElementById('lote-tipo').value;
            const descripcion = document.getElementById('lote-descripcion').value.trim();
            const pesoKg = document.getElementById('lote-peso').value;
            const caducidad = document.getElementById('lote-caducidad').value;
            const evaluador = document.getElementById('lote-evaluador').value.trim();
            const fotoInput = document.getElementById('lote-foto');
            const direccionSalida = document.getElementById('lote-direccion-salida').value.trim();
            const deslindeAceptado = checkDeslinde ? checkDeslinde.checked : false;

            if (!tipo || !descripcion || !pesoKg || !caducidad || !evaluador || !direccionSalida) {
                mensajePublicar.style.color = 'red';
                mensajePublicar.textContent = 'Por favor, llena todos los campos obligatorios.';
                return;
            }

            if (!deslindeAceptado) {
                mensajePublicar.style.color = 'red';
                mensajePublicar.textContent = 'Debes aceptar el deslinde de responsabilidades.';
                return;
            }

            const usuarioActual = obtenerSesion();
            const idUsuarioValido = usuarioActual ? (usuarioActual.idusuarios || usuarioActual.id || usuarioActual.idUsuario) : null;

            if (!idUsuarioValido || isNaN(Number(idUsuarioValido))) {
                mensajePublicar.style.color = 'red';
                mensajePublicar.textContent = 'Error: No se encontró una sesión válida. Vuelve a iniciar sesión.';
                return;
            }

            btnPublicar.disabled = true;
            const textoOriginal = btnPublicar.textContent;
            btnPublicar.textContent = 'Publicando lote...';

            try {
                const foto = fotoInput.files[0] || null;

                const datosLote = {
                    tipos_idtipos: obtenerIdTipo(tipo),
                    tipo,
                    descripcion,
                    pesoKg: Number(pesoKg),
                    caducidad,
                    evaluador,
                    direccionSalida,
                    deslindeAceptado,
                    usuarios_idusuarios: Number(idUsuarioValido)
                };

                await publicarLote(datosLote, foto);

                mensajePublicar.style.color = 'green';
                mensajePublicar.textContent = '¡Lote publicado con éxito!';
                formPublicar.reset();
                if (checkDeslinde) checkDeslinde.checked = false;

                await cargarEstadoLotes();

            } catch (error) {
                console.error('Error al publicar lote:', error);
                mensajePublicar.style.color = 'red';
                mensajePublicar.textContent = 'Error: ' + error.message;
            } finally {
                btnPublicar.textContent = textoOriginal;
                btnPublicar.disabled = checkDeslinde ? !checkDeslinde.checked : true;
            }
        });
    }

    await cargarEstadoLotes();
});

function obtenerIdTipo(tipoTexto) {
    const mapaTipos = {
        "Lácteos y derivados": 1, "Carnes, pescados y huevos": 2,
        "Legumbres, frutos secos y semillas": 3, "Verduras y hortalizas": 4,
        "Frutas": 5, "Cereales y tuberculos": 6,
        "Grasas y aceites": 7, "Azucar, sal, condimentos y dulces": 8
    };
    return mapaTipos[tipoTexto] || 1;
}