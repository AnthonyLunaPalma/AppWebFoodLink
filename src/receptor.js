document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Contenedor o sección de perfil abajo (buscamos o creamos el espacio si no está definido explícitamente)
    let seccionPerfilAbajo = document.getElementById('seccion-perfil-receptor');

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

    // --- CARGAR DATOS DE AMBAS SECCIONES EN TARJETAS ---
    async function cargarDatosReceptor() {
        try {
            if (contenedorDisponibles) contenedorDisponibles.innerHTML = '<p class="texto-descripcion">Cargando...</p>';
            if (contenedorAceptados) contenedorAceptados.innerHTML = '<p class="texto-descripcion">Cargando...</p>';

            const respuesta = await fetch('http://localhost:3000/api/pedidos');
            let lotes = await respuesta.json();

            if (!Array.isArray(lotes)) lotes = [];

            // 1. Filtrar los disponibles (Estatus 1) y limitar estrictamente a los 15 más recientes
            const lotesDisponibles = lotes
                .filter(l => Number(l.status_idstatus) === 1)
                .slice(0, 15);

            // 2. Filtrar los aceptados (Estatus 2) que pertenezcan estrictamente a este receptor en la BD
            const lotesAceptados = lotes
                .filter(l => Number(l.status_idstatus) === 2 && Number(l.receptor_idusuarios) === Number(idUsuarioActual));

            // --- RENDERIZAR PERFIL Y TARJETA DE ESTADÍSTICA ABAJO ---
            if (seccionPerfilAbajo || document.getElementById('perfil-usuario-abajo')) {
                let contenedorPerfil = document.getElementById('perfil-usuario-abajo');
                if (!contenedorPerfil) {
                    contenedorPerfil = document.createElement('div');
                    contenedorPerfil.id = 'perfil-usuario-abajo';
                    seccionPerfilAbajo.appendChild(contenedorPerfil);
                }

                contenedorPerfil.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-top: 20px;';
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

            // --- RENDERIZAR TARJETAS ACEPTADOS (SIN PIN) ---
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

        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    }

    // --- FUNCIÓN GLOBAL PARA ACEPTAR O CANCELAR ---
    window.cambiarEstatusLote = async function(idpedidos, accion, btn) {
        if (btn.disabled) return;
        btn.disabled = true;
        const textoOriginal = btn.textContent;
        btn.textContent = accion === 'aceptar' ? 'Aceptando...' : 'Cancelando...';
        btn.style.opacity = '0.6';

        try {
            const endpoint = accion === 'aceptar' 
                ? `http://localhost:3000/api/pedidos/${idpedidos}/aceptar`
                : `http://localhost:3000/api/pedidos/${idpedidos}/cancelar`;

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
            if (textoErrorLote) textoErrorL0te = err.message; // corrección tipográfica menor
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