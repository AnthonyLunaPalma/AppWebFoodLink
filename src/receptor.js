document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURACIÓN DE URL (Render con respaldo local) ---
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://appwebfoodlink.onrender.com';

    // --- GESTIÓN DE SESIÓN ---
    const usuarioActivo = obtenerSesion();
    const spanUsuario = document.getElementById('texto-usuario');

    const modalNoDisponible = document.getElementById('modal-lote-no-disponible');
    const textoErrorLote = document.getElementById('texto-error-lote');
    const btnRecargarPagina = document.getElementById('btn-recargar-pagina');

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

    // --- CONTENEDORES EN EL HTML ---
    const contenedorDisponibles = document.getElementById('lista-lotes-disponibles');
    const contenedorAceptados = document.getElementById('lista-lotes-receptor');
    const contenedorPerfil = document.getElementById('perfil-receptor');
    const contenedorEvaluar = document.getElementById('lista-lotes-evaluar'); // NUEVO CONTENEDOR PARA EVALUAR

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

    // --- CARGAR DATOS GENERALES Y DE EVALUACIÓN ---
    async function cargarDatosReceptor() {
        try {
            if (contenedorDisponibles) contenedorDisponibles.innerHTML = '<p class="texto-descripcion">Cargando...</p>';
            if (contenedorAceptados) contenedorAceptados.innerHTML = '<p class="texto-descripcion">Cargando...</p>';

            const respuesta = await fetch(`${API_URL}/api/pedidos`);
            let lotes = await respuesta.json();

            if (!Array.isArray(lotes)) lotes = [];

            // 1. Filtrar los disponibles (Estatus 1) y limitar estrictamente a los 15 más recientes
            const lotesDisponibles = lotes
                .filter(l => Number(l.status_idstatus) === 1)
                .slice(0, 15);

            // 2. Filtrar los aceptados (Estatus 2) que pertenezcan estrictamente a este receptor en la BD
            const lotesAceptados = lotes
                .filter(l => Number(l.status_idstatus) === 2 && Number(l.receptor_idusuarios) === Number(idUsuarioActual));

            // --- RENDERIZAR PERFIL ---
            if (contenedorPerfil) {
                contenedorPerfil.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
                contenedorPerfil.innerHTML = `
                    <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px;">
                        <h3 style="margin: 0; color: #5c3a40; font-size: 1.1rem; border-bottom: 1px solid #eee; padding-bottom: 6px;">Mi Perfil</h3>
                        <p style="margin: 0; font-size: 0.95rem;"><strong>Nombre:</strong> ${usuarioActivo.nombre}</p>
                        <p style="margin: 0; font-size: 0.95rem;"><strong>Cuenta:</strong> ${usuarioActivo.cuenta}</p>
                    </div>
                    <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.95rem; font-weight: bold; color: #5c3a40;">Total de lotes aceptados:</span>
                        <span style="background: #5c3a40; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 1rem;">${lotesAceptados.length}</span>
                    </div>
                `;
            }

            // --- RENDERIZAR TARJETAS DISPONIBLES ---
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
                            <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                                <button type="button" onclick="cambiarEstatusLote(${l.idpedidos}, 'aceptar', this)" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Aceptar</button>
                            </div>
                        `;
                        contenedorDisponibles.appendChild(tarjeta);
                    });
                }
            }

            // --- RENDERIZAR TARJETAS ACEPTADOS ---
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

            // --- CARGAR SECCIÓN DE EVALUACIÓN ---
            await cargarDatosEvaluacion();

        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    }

    // --- CARGAR Y RENDERIZAR EVALUACIONES DE PARTICIPANTES ---
    async function cargarDatosEvaluacion() {
        if (!contenedorEvaluar) return;
        try {
            contenedorEvaluar.innerHTML = '<p class="texto-descripcion">Cargando evaluaciones...</p>';
            const respuesta = await fetch(`${API_URL}/api/receptor/evaluaciones?receptor_id=${idUsuarioActual}`);
            const data = await respuesta.json();

            contenedorEvaluar.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                contenedorEvaluar.innerHTML = '<p class="texto-descripcion">No hay lotes aceptados para evaluar.</p>';
                return;
            }

            contenedorEvaluar.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
            data.forEach(item => {
                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-evaluacion';
                tarjeta.style.cssText = 'background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 12px;';

                let htmlDonador = '';
                if (item.donador) {
                    if (item.calificacion_donador !== null) {
                        htmlDonador = `<p style="margin: 0; font-size: 0.9rem; color: #28a745;">✓ Donador (${item.donador.nombre}) ya evaluado con ${item.calificacion_donador} ⭐</p>`;
                    } else {
                        htmlDonador = `
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.9rem;"><strong>Donador:</strong> ${item.donador.nombre} (${item.donador.cuenta})</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <select id="estrellas-donador-${item.idpedidos}" style="padding: 4px; border-radius: 4px;">
                                        <option value="5">5 Estrellas ⭐⭐⭐⭐⭐</option>
                                        <option value="4">4 Estrellas ⭐⭐⭐⭐</option>
                                        <option value="3">3 Estrellas ⭐⭐⭐</option>
                                        <option value="2">2 Estrellas ⭐⭐</option>
                                        <option value="1">1 Estrella ⭐</option>
                                    </select>
                                    <button type="button" onclick="enviarEvaluacion(${item.idpedidos}, ${item.donador.idusuarios}, 'donador', this)" style="padding: 4px 10px; background: #5c3a40; color: white; border: none; border-radius: 4px; cursor: pointer;">Evaluar Donador</button>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    htmlDonador = `<p style="margin: 0; font-size: 0.9rem; color: #888;">Donador no disponible.</p>`;
                }

                let htmlVoluntario = '';
                if (item.voluntario) {
                    if (item.calificacion_voluntario !== null) {
                        htmlVoluntario = `<p style="margin: 0; font-size: 0.9rem; color: #28a745; margin-top: 8px;">✓ Voluntario (${item.voluntario.nombre}) ya evaluado con ${item.calificacion_voluntario} ⭐</p>`;
                    } else {
                        htmlVoluntario = `
                            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
                                <label style="font-size: 0.9rem;"><strong>Voluntario:</strong> ${item.voluntario.nombre} (${item.voluntario.cuenta})</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <select id="estrellas-voluntario-${item.idpedidos}" style="padding: 4px; border-radius: 4px;">
                                        <option value="5">5 Estrellas ⭐⭐⭐⭐⭐</option>
                                        <option value="4">4 Estrellas ⭐⭐⭐⭐</option>
                                        <option value="3">3 Estrellas ⭐⭐⭐</option>
                                        <option value="2">2 Estrellas ⭐⭐</option>
                                        <option value="1">1 Estrella ⭐</option>
                                    </select>
                                    <button type="button" onclick="enviarEvaluacion(${item.idpedidos}, ${item.voluntario.idusuarios}, 'voluntario', this)" style="padding: 4px 10px; background: #5c3a40; color: white; border: none; border-radius: 4px; cursor: pointer;">Evaluar Voluntario</button>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    htmlVoluntario = `<p style="margin: 0; font-size: 0.9rem; color: #888; margin-top: 8px;">Sin voluntario asignado en este lote.</p>`;
                }

                tarjeta.innerHTML = `
                    <div style="border-bottom: 1px solid #eee; padding-bottom: 6px;">
                        <span style="font-weight: bold; color: #5c3a40;">Lote #${item.idpedidos}</span> - <span style="font-size: 0.9rem; color: #666;">${item.descripcion}</span>
                    </div>
                    ${htmlDonador}
                    ${htmlVoluntario}
                `;
                contenedorEvaluar.appendChild(tarjeta);
            });
        } catch (err) {
            console.error('Error al cargar evaluaciones:', err);
        }
    }

    // --- FUNCIÓN GLOBAL PARA ENVIAR EVALUACIÓN ---
    window.enviarEvaluacion = async function(loteId, evaluadoId, tipo, btn) {
        const select = document.getElementById(`estrellas-${tipo}-${loteId}`);
        const estrellas = select ? select.value : 5;

        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            const respuesta = await fetch(`${API_URL}/api/evaluar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lote_id: loteId,
                    evaluado_id: evaluadoId,
                    tipo: tipo,
                    estrellas: Number(estrellas)
                })
            });

            const resultado = await respuesta.json();
            if (!respuesta.ok) throw new Error(resultado.error || 'Error al guardar');

            alert(resultado.mensaje);
            await cargarDatosReceptor();
        } catch (err) {
            alert('Error: ' + err.message);
            btn.disabled = false;
            btn.textContent = `Evaluar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
        }
    };

    // --- FUNCIÓN GLOBAL PARA ACEPTAR O CANCELAR ---
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
                alert('Error: ' + err.message);
            }

            btn.disabled = false;
            btn.textContent = textoOriginal;
            btn.style.opacity = '1';
        }
    };

    await cargarDatosReceptor();
});