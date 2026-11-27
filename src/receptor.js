document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://appwebfoodlink.onrender.com';

    const usuarioActivo = obtenerSesion();
    const spanUsuario = document.getElementById('texto-usuario');

    const modalNoDisponible = document.getElementById('modal-lote-no-disponible');
    const textoErrorLote = document.getElementById('texto-error-lote');
    const btnRecargarPagina = document.getElementById('btn-recargar-pagina');

    // Elementos del modal de reporte personalizado
    const modalReportar = document.getElementById('modal-reportar');
    const inputMotivoReporte = document.getElementById('input-motivo-reporte');
    const btnCancelarReporte = document.getElementById('btn-cancelar-reporte');
    const btnEnviarReporte = document.getElementById('btn-enviar-reporte');
    let pedidoIdParaReportar = null;

    // Elemento del modal genérico de aviso/éxito si existe, o lo creamos dinámicamente
    function mostrarModalAviso(titulo, mensaje, esExito = true) {
        let modalAviso = document.getElementById('modal-aviso-personalizado');
        const esOscuro = document.body.classList.contains('dark-mode');

        if (!modalAviso) {
            modalAviso = document.createElement('div');
            modalAviso.id = 'modal-aviso-personalizado';
            modalAviso.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 2000;';
            document.body.appendChild(modalAviso);
        }

        // Estilos dinámicos según el modo oscuro o claro actual
        const bgColor = esOscuro ? '#430617' : '#fff';
        const textColor = esOscuro ? '#ffffff' : '#555';
        const titleColor = esExito ? '#28a745' : '#a02020';

        modalAviso.innerHTML = `
            <div style="background: ${bgColor}; padding: 25px; border-radius: 8px; width: 350px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 1px solid ${esOscuro ? '#6b1226' : '#e0e0e0'};">
                <h3 style="margin-bottom: 10px; color: ${titleColor};">${titulo}</h3>
                <p style="margin-bottom: 20px; color: ${textColor}; font-size: 0.95rem;">${mensaje}</p>
                <button type="button" id="btn-cerrar-aviso" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Aceptar</button>
            </div>
        `;

        modalAviso.style.display = 'flex';

        document.getElementById('btn-cerrar-aviso').onclick = () => {
            modalAviso.style.display = 'none';
        };
    }

    if (btnRecargarPagina) {
        btnRecargarPagina.addEventListener('click', () => {
            window.location.reload();
        });
    }

    if (!usuarioActivo) {
        window.location.href = 'iniciosesion.html';
        return;
    }

    if (spanUsuario) {
        spanUsuario.textContent = `👤 ${usuarioActivo.nombre} (${usuarioActivo.cuenta})`;
        spanUsuario.style.fontWeight = 'bold';
        spanUsuario.style.color = '#5c3a40';
        spanUsuario.style.marginRight = '1rem';
        spanUsuario.style.display = 'flex';
        spanUsuario.style.alignItems = 'center';
    }

    const idUsuarioActual = usuarioActivo.idusuarios || usuarioActivo.id;

    const contenedorDisponibles = document.getElementById('lista-lotes-disponibles');
    const contenedorAceptados = document.getElementById('lista-lotes-receptor');
    const contenedorPerfil = document.getElementById('perfil-receptor');
    const contenedorEvaluar = document.getElementById('lista-lotes-evaluar');

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

    async function cargarDatosReceptor() {
        try {
            if (contenedorDisponibles) contenedorDisponibles.innerHTML = '<p class="texto-descripcion">Cargando...</p>';
            if (contenedorAceptados) contenedorAceptados.innerHTML = '<p class="texto-descripcion">Cargando...</p>';

            const respuesta = await fetch(`${API_URL}/api/pedidos`);
            let lotes = await respuesta.json();

            if (!Array.isArray(lotes)) lotes = [];

            const lotesDisponibles = lotes
                .filter(l => Number(l.status_idstatus) === 1)
                .slice(0, 15);

            const lotesAceptados = lotes
                .filter(l => Number(l.status_idstatus) === 2 && Number(l.receptor_idusuarios) === Number(idUsuarioActual));

            if (contenedorDisponibles) {
                contenedorDisponibles.innerHTML = '';
                if (lotesDisponibles.length === 0) {
                    contenedorDisponibles.innerHTML = '<p class="texto-descripcion">No hay lotes disponibles en este momento.</p>';
                } else {
                    contenedorDisponibles.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
                    lotesDisponibles.forEach(l => {
                        const tarjeta = document.createElement('div');
                        tarjeta.className = 'tarjeta-lote';
                        tarjeta.style.cssText = 'background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px;';

                        tarjeta.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 6px;">
                                <span style="font-weight: bold; color: #5c3a40;">${TIPOS_NOMBRES[l.tipos_idtipos] || 'Desconocido'}</span>
                                <span style="font-size: 0.9rem; font-weight: bold; color: #28a745;">${l.peso} kg</span>
                            </div>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Descripción:</strong> ${l.descripcion}</p>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Evaluador:</strong> ${l.evaluador}</p>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Cuenta (Donador):</strong> ${l.cuenta_usuario || 'Desconocida'}</p>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Dirección Salida:</strong> ${l.direccion_salida}</p>
                            <p style="margin: 0; font-size: 0.85rem; color: #888;">Caducidad: ${l.caducidad ? new Date(l.caducidad).toLocaleString() : 'N/A'}</p>
                            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
                                <button type="button" onclick="abrirModalReportar(${l.idpedidos})" style="padding: 8px 12px; background: #d9534f; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🚩 Reportar</button>
                                <button type="button" onclick="cambiarEstatusLote(${l.idpedidos}, 'aceptar', this)" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Aceptar</button>
                            </div>
                        `;
                        contenedorDisponibles.appendChild(tarjeta);
                    });
                }
            }

            if (contenedorAceptados) {
                contenedorAceptados.innerHTML = '';
                if (lotesAceptados.length === 0) {
                    contenedorAceptados.innerHTML = '<p class="texto-descripcion">No tienes lotes aceptados todavía.</p>';
                } else {
                    contenedorAceptados.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
                    lotesAceptados.forEach(l => {
                        const tarjeta = document.createElement('div');
                        tarjeta.className = 'tarjeta-lote-aceptado';
                        tarjeta.style.cssText = 'background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px;';

                        tarjeta.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 6px;">
                                <span style="font-weight: bold; color: #5c3a40;">${TIPOS_NOMBRES[l.tipos_idtipos] || 'Desconocido'}</span>
                                <span style="font-size: 0.9rem; font-weight: bold; color: #28a745;">${l.peso} kg</span>
                            </div>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Descripción:</strong> ${l.descripcion}</p>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Evaluador:</strong> ${l.evaluador}</p>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Cuenta (Donador):</strong> ${l.cuenta_usuario || 'Desconocida'}</p>
                            <p style="margin: 0; font-size: 0.95rem;"><strong>Dirección Salida:</strong> ${l.direccion_salida}</p>
                            <p style="margin: 0; font-size: 0.85rem; color: #888;">Caducidad: ${l.caducidad ? new Date(l.caducidad).toLocaleString() : 'N/A'}</p>
                            <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                                <button type="button" onclick="cambiarEstatusLote(${l.idpedidos}, 'cancelar', this)" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Cancelar</button>
                            </div>
                        `;
                        contenedorAceptados.appendChild(tarjeta);
                    });
                }
            }

            await cargarDatosEvaluacion();

        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    }

    // --- LÓGICA DEL MODAL DE REPORTE PERSONALIZADO ---
    window.abrirModalReportar = function(idPedido) {
        pedidoIdParaReportar = idPedido;
        if (inputMotivoReporte) inputMotivoReporte.value = '';
        if (modalReportar) modalReportar.style.display = 'flex';
    };

    if (btnCancelarReporte) {
        btnCancelarReporte.addEventListener('click', () => {
            if (modalReportar) modalReportar.style.display = 'none';
            pedidoIdParaReportar = null;
        });
    }

    if (btnEnviarReporte) {
        btnEnviarReporte.addEventListener('click', async () => {
            const motivo = inputMotivoReporte ? inputMotivoReporte.value.trim() : '';
            if (!motivo) {
                mostrarModalAviso("Atención", "Por favor, escribe un motivo para el reporte.", false);
                return;
            }

            btnEnviarReporte.disabled = true;
            btnEnviarReporte.textContent = 'Enviando...';

            try {
                const respuesta = await fetch(`${API_URL}/api/reportes-lotes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pedidos_idpedidos: pedidoIdParaReportar,
                        usuarios_idusuarios: idUsuarioActual,
                        motivo: motivo
                    })
                });
                const resultado = await respuesta.json();
                if (!respuesta.ok) throw new Error(resultado.error || 'Error al reportar');
                
                if (modalReportar) modalReportar.style.display = 'none';
                
                // Usamos el modal visual en lugar de alert
                mostrarModalAviso("¡Éxito!", resultado.mensaje || "Lote reportado con éxito.", true);
            } catch (err) {
                mostrarModalAviso("Error", err.message, false);
            } finally {
                btnEnviarReporte.disabled = false;
                btnEnviarReporte.textContent = 'Enviar Reporte';
            }
        });
    }

    window.cambiarEstatusLote = async function(idpedidos, accion, btn) {
        if (btn.disabled) return;
        btn.disabled = true;
        const textoOriginal = btn.textContent;
        btn.textContent = accion === 'aceptar' ? 'Aceptando...' : 'Cancelando...';
        btn.style.opacity = '0.6';

        try {
            const endpoint = accion === 'aceptar' 
                ? `${API_URL}/api/pedidos/${idpedidos}/aceptar`
                : `${API_URL}/api/pedidos/${idpedidos}/cancelar`;

            const opcionesFetch = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: accion === 'aceptar' ? JSON.stringify({ usuarios_idusuarios: idUsuarioActual }) : undefined
            };

            const respuesta = await fetch(endpoint, opcionesFetch);
            const resultado = await respuesta.json();
            if (!respuesta.ok) throw new Error(resultado.error || 'Error al procesar la solicitud.');

            await cargarDatosReceptor();
        } catch (err) {
            if (textoErrorLote) textoErrorLote.textContent = err.message;
            if (modalNoDisponible) {
                modalNoDisponible.style.display = 'flex';
            } else {
                mostrarModalAviso("Error", err.message, false);
            }

            btn.disabled = false;
            btn.textContent = textoOriginal;
            btn.style.opacity = '1';
        }
    };

    await cargarDatosReceptor();
});