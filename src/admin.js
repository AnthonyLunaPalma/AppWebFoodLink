document.addEventListener('DOMContentLoaded', () => {
    // Obtenemos los datos del usuario logueado en esta pestaña específica
    const usuarioActivo = obtenerSesion();
    const spanUsuario = document.getElementById('texto-usuario');

    if (usuarioActivo && spanUsuario) {
        // Mostramos su nombre y cuenta en el encabezado
        spanUsuario.textContent = `👤 ${usuarioActivo.nombre} (${usuarioActivo.cuenta})`;
        spanUsuario.style.fontWeight = 'bold';
        spanUsuario.style.color = '#5c3a40';
        spanUsuario.style.marginRight = '1rem';
        spanUsuario.style.display = 'flex';
        spanUsuario.style.alignItems = 'center';
    }
});
document.addEventListener('DOMContentLoaded', async () => {
    const panelAdmin = document.getElementById('pagina-panel');
    if (!panelAdmin || panelAdmin.dataset.rol !== 'Admin') return;

    const contenedorPendientes = document.getElementById('lista-usuarios-pendientes');
    const contenedorUsuarios = document.getElementById('lista-usuarios');
    const contenedorLotesAdmin = document.getElementById('lista-lotes-admin');
    const filtroRol = document.getElementById('filtro-rol');

    const STATUS_BD = {
        1: "Notificado al donador",
        2: "Aceptado",
        3: "Entregado al voluntario",
        4: "En camino",
        5: "Entregado al receptor"
    };

    const TIPOS_NOMBRES = {
        1: "Lácteos y derivados",
        2: "Carnes, pescados y huevos",
        3: "Legumbres, frutos secos y semillas",
        4: "Verduras y hortalizas",
        5: "Frutas",
        6: "Cereales y tubérculos",
        7: "Grasas y aceites",
        8: "Azúcares y dulces"
    };

    let todosLosUsuarios = [];
    let idUsuarioAEliminar = null; 
    let idUsuarioARechazar = null; 

    async function cargarPanelAdmin() {
        await cargarPendientes();
        await cargarUsuariosActivos();
        await cargarLotesAdmin();
    }

    const inputBuscarFecha = document.getElementById('input-buscar-fecha');

    async function cargarLotesAdmin() {
        if (!contenedorLotesAdmin) return;
        try {
            contenedorLotesAdmin.innerHTML = '<p class="texto-descripcion">Cargando lotes...</p>';
            
            const fechaSeleccionada = inputBuscarFecha ? inputBuscarFecha.value : '';
            let url = 'http://localhost:3000/api/pedidos';
            if (fechaSeleccionada) {
                url += `?fecha=${encodeURIComponent(fechaSeleccionada)}`;
            }

            const respuesta = await fetch(url);
            const lotes = await respuesta.json();

            // El dashboard calcula con todos los datos obtenidos
            actualizarDashboard(lotes);

            // Si NO hay fecha seleccionada, limitamos la tabla a los últimos 15 lotes
            const lotesMostrados = fechaSeleccionada 
                ? lotes 
                : (Array.isArray(lotes) ? lotes.slice(0, 15) : []);

            contenedorLotesAdmin.innerHTML = '';

            if (!lotesMostrados || lotesMostrados.length === 0) {
                contenedorLotesAdmin.innerHTML = '<p class="texto-descripcion">No se encontraron lotes para esta fecha.</p>';
                return;
            }

            const tabla = crearEstructuraTabla(['ID', 'Tipo', 'Descripción', 'Peso', 'Evaluador', 'Cuenta', 'Dirección Salida', 'Caducidad', 'Estatus']);
            const tbody = tabla.querySelector('tbody');

            lotesMostrados.forEach(l => {
                const fila = document.createElement('tr');
                const nombreTipo = TIPOS_NOMBRES[l.tipos_idtipos] || 'Desconocido';
                const nombreEstatus = STATUS_BD[l.status_idstatus] || 'Pendiente';
                const fechaCaducidad = l.caducidad ? new Date(l.caducidad).toLocaleString() : 'N/A';
                const cuentaUsuario = l.cuenta_usuario || 'Desconocida';

                fila.innerHTML = `
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.idpedidos}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${nombreTipo}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.descripcion}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.peso} kg</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.evaluador}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2b2b2b;">${cuentaUsuario}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${l.direccion_salida}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${fechaCaducidad}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #9d0208;">${nombreEstatus}</td>
                `;
                tbody.appendChild(fila);
            });

            contenedorLotesAdmin.appendChild(tabla);
        } catch (error) {
            contenedorLotesAdmin.innerHTML = `<p style="color: red;">Error al cargar los lotes: ${error.message}</p>`;
        }
    }

    // Escuchar cuando el usuario elija o borre una fecha en el calendario
    if (inputBuscarFecha) {
        inputBuscarFecha.addEventListener('change', cargarLotesAdmin);
        inputBuscarFecha.addEventListener('input', () => {
            if (!inputBuscarFecha.value) cargarLotesAdmin();
        });
    }

    // 1. Cargar solicitudes pendientes (Estado 2)
    async function cargarPendientes() {
        try {
            contenedorPendientes.innerHTML = '<p class="texto-descripcion">Cargando solicitudes...</p>';
            const pendientes = await listarUsuariosPendientes();

            contenedorPendientes.innerHTML = '';

            if (!pendientes || pendientes.length === 0) {
                contenedorPendientes.innerHTML = '<p class="texto-descripcion">No hay solicitudes pendientes.</p>';
                return;
            }

            const tabla = crearEstructuraTabla(['ID', 'Nombre', 'Cuenta', 'Correo', 'Acciones']);
            const tbody = tabla.querySelector('tbody');

            pendientes.forEach(u => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td style="padding: 8px;">${u.idusuarios}</td>
                    <td style="padding: 8px;">${u.nombre}</td>
                    <td style="padding: 8px;">${u.cuenta}</td>
                    <td style="padding: 8px;">${u.correo}</td>
                    <td style="padding: 8px; text-align: center;">
                        <button type="button" onclick="ejecutarAprobacion(${u.idusuarios}, this)" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Aceptar</button>
                        <button type="button" onclick="abrirModalRechazar(${u.idusuarios})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Rechazar</button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
            contenedorPendientes.appendChild(tabla);
        } catch (error) {
            contenedorPendientes.innerHTML = `<p style="color: red;">Error al cargar pendientes: ${error.message}</p>`;
        }
    }

   const inputBuscarCuenta = document.getElementById('input-buscar-cuenta');

    async function cargarUsuariosActivos() {
        try {
            contenedorUsuarios.innerHTML = '<p class="texto-descripcion">Cargando usuarios...</p>';
            const textoBusqueda = inputBuscarCuenta ? inputBuscarCuenta.value.trim() : '';

            const filtrados = await listarUsuarios(textoBusqueda);

            contenedorUsuarios.innerHTML = '';

            if (!filtrados || filtrados.length === 0) {
                contenedorUsuarios.innerHTML = '<p class="texto-descripcion">No se encontraron usuarios activos.</p>';
                return;
            }

            const tabla = crearEstructuraTabla(['ID', 'Nombre', 'Cuenta', 'Correo', 'Rol', 'Acciones']);
            const tbody = tabla.querySelector('tbody');

            filtrados.forEach(u => {
                const fila = document.createElement('tr');
                const rolTexto = u.rol || ROLES_BD[u.rol_idrol] || 'Desconocido';
                fila.innerHTML = `
                    <td style="padding: 8px;">${u.idusuarios}</td>
                    <td style="padding: 8px;">${u.nombre}</td>
                    <td style="padding: 8px;">${u.cuenta}</td>
                    <td style="padding: 8px;">${u.correo}</td>
                    <td style="padding: 8px;">${rolTexto}</td>
                    <td style="padding: 8px; text-align: center;">
                        <button type="button" onclick="abrirModalEliminar(${u.idusuarios})" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
            contenedorUsuarios.appendChild(tabla);
        } catch (error) {
            contenedorUsuarios.innerHTML = `<p style="color: red;">Error al cargar usuarios: ${error.message}</p>`;
        }
    }

    if (inputBuscarCuenta) {
        inputBuscarCuenta.addEventListener('input', () => {
            cargarUsuariosActivos();
        });
    }

    function crearEstructuraTabla(columnas) {
        const tabla = document.createElement('table');
        tabla.style.width = '100%';
        tabla.style.borderCollapse = 'collapse';
        let ths = columnas.map(c => `<th style="padding: 8px; text-align: left;">${c}</th>`).join('');
        tabla.innerHTML = `<thead><tr style="border-bottom: 2px solid #ccc;">${ths}</tr></thead><tbody></tbody>`;
        return tabla;
    }

    // Aprobación de usuario pendiente con protección contra múltiples clics
    window.ejecutarAprobacion = async function(id, btn) {
        if (btn.disabled) return;
        btn.disabled = true;
        const textoOriginal = btn.textContent;
        btn.textContent = 'Aprobando...';
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';

        try {
            await aprobarUsuario(id);
            todosLosUsuarios = [];
            await cargarPanelAdmin();
        } catch (err) {
            alert('Error al aprobar usuario: ' + err.message);
            btn.disabled = false;
            btn.textContent = textoOriginal;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    };

    // --- LÓGICA DEL MODAL DE ELIMINAR ---
    const modalEliminar = document.getElementById('modal-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

    window.abrirModalEliminar = function(id) {
        idUsuarioAEliminar = id;
        if (modalEliminar) modalEliminar.style.display = 'flex';
    };

    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener('click', () => {
            if (modalEliminar) modalEliminar.style.display = 'none';
            idUsuarioAEliminar = null;
        });
    }

    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async () => {
            if (idUsuarioAEliminar !== null && !btnConfirmarEliminar.disabled) {
                btnConfirmarEliminar.disabled = true;
                const textoOriginal = btnConfirmarEliminar.textContent;
                btnConfirmarEliminar.textContent = 'Eliminando...';
                btnConfirmarEliminar.style.opacity = '0.6';
                btnConfirmarEliminar.style.cursor = 'not-allowed';

                try {
                    await eliminarUsuario(idUsuarioAEliminar);
                    if (modalEliminar) modalEliminar.style.display = 'none';
                    todosLosUsuarios = [];
                    await cargarPanelAdmin();
                } catch (err) {
                    alert('No se pudo eliminar: ' + err.message);
                } finally {
                    btnConfirmarEliminar.disabled = false;
                    btnConfirmarEliminar.textContent = textoOriginal;
                    btnConfirmarEliminar.style.opacity = '1';
                    btnConfirmarEliminar.style.cursor = 'pointer';
                }
            }
        });
    }

    // --- LÓGICA DEL MODAL DE RECHAZAR ---
    const modalRechazar = document.getElementById('modal-rechazar');
    const btnCancelarRechazar = document.getElementById('btn-cancelar-rechazar');
    const btnConfirmarRechazar = document.getElementById('btn-confirmar-rechazar');

    window.abrirModalRechazar = function(id) {
        idUsuarioARechazar = id;
        if (modalRechazar) modalRechazar.style.display = 'flex';
    };

    if (btnCancelarRechazar) {
        btnCancelarRechazar.addEventListener('click', () => {
            if (modalRechazar) modalRechazar.style.display = 'none';
            idUsuarioARechazar = null;
        });
    }

    if (btnConfirmarRechazar) {
        btnConfirmarRechazar.addEventListener('click', async () => {
            if (idUsuarioARechazar !== null && !btnConfirmarRechazar.disabled) {
                btnConfirmarRechazar.disabled = true;
                const textoOriginal = btnConfirmarRechazar.textContent;
                btnConfirmarRechazar.textContent = 'Rechazando...';
                btnConfirmarRechazar.style.opacity = '0.6';
                btnConfirmarRechazar.style.cursor = 'not-allowed';

                try {
                    await rechazarUsuario(idUsuarioARechazar);
                    if (modalRechazar) modalRechazar.style.display = 'none';
                    await cargarPanelAdmin();
                } catch (err) {
                    alert('No se pudo rechazar: ' + err.message);
                } finally {
                    btnConfirmarRechazar.disabled = false;
                    btnConfirmarRechazar.textContent = textoOriginal;
                    btnConfirmarRechazar.style.opacity = '1';
                    btnConfirmarRechazar.style.cursor = 'pointer';
                }
            }
        });
    }

    if (filtroRol) {
        filtroRol.addEventListener('change', cargarUsuariosActivos);
    }

    // Función para actualizar los contadores del Dashboard basándose en los lotes
    function actualizarDashboard(lotes) {
        const spanKg = document.getElementById('valor-kg');
        const spanRaciones = document.getElementById('valor-raciones');
        const spanEvitados = document.getElementById('valor-evitados');

        if (!lotes || lotes.length === 0) {
            if (spanKg) spanKg.innerHTML = '<b>0</b>';
            if (spanRaciones) spanRaciones.innerHTML = '<b>0</b>';
            if (spanEvitados) spanEvitados.innerHTML = '<b>0</b>';
            return;
        }

        let totalKilos = lotes.reduce((acumulado, lote) => {
            const pesoNumerico = parseFloat(lote.peso) || 0;
            return acumulado + pesoNumerico;
        }, 0);

        let totalRaciones = totalKilos * 5;
        let totalLotes = lotes.length;

        if (spanKg) spanKg.innerHTML = `<b>${totalKilos}</b>`;
        if (spanRaciones) spanRaciones.innerHTML = `<b>${totalRaciones}</b>`;
        if (spanEvitados) spanEvitados.innerHTML = `<b>${totalLotes}</b>`;
    }

    // --- LÓGICA PARA DESCARGAR EL REPORTE CSV ---
    const btnGenerarReporte = document.getElementById('btn-generar-reporte');

    if (btnGenerarReporte) {
        btnGenerarReporte.addEventListener('click', async () => {
            try {
                const respuesta = await fetch('http://localhost:3000/api/pedidos');
                const lotes = await respuesta.json();

                if (!lotes || lotes.length === 0) {
                    alert('No hay lotes registrados para generar el reporte.');
                    return;
                }

                let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
                csvContent += "Numero de Lote,Tipo,Descripción,Peso (kg),Caducidad,Evaluador,Estado\n";

                lotes.forEach(l => {
                    const numLote = l.idpedidos || '';
                    const tipo = (TIPOS_NOMBRES[l.tipos_idtipos] || 'Desconocido').replace(/,/g, ''); 
                    const descripcion = `"${(l.descripcion || '').replace(/"/g, '""')}"`; 
                    const peso = l.peso || '';
                    const caducidad = l.caducidad ? new Date(l.caducidad).toLocaleString() : '';
                    const evaluador = `"${(l.evaluador || '').replace(/"/g, '""')}"`;
                    const estado = STATUS_BD[l.status_idstatus] || 'Pendiente';

                    const fila = [numLote, tipo, descripcion, peso, caducidad, evaluador, estado].join(",");
                    csvContent += fila + "\n";
                });

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "reporte-foodlink.csv");
                document.body.appendChild(link);

                link.click(); 
                document.body.removeChild(link); 

            } catch (error) {
                alert('Error al generar el reporte CSV: ' + error.message);
            }
        });
    }

    cargarPanelAdmin();
});