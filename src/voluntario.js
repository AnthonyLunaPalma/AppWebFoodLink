document.addEventListener('DOMContentLoaded', async () => {
    // --- GESTIÓN DE SESIÓN ---
    const usuarioActivo = obtenerSesion();
    const spanUsuario = document.getElementById('texto-usuario');

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
    const contenedorMisRutas = document.getElementById('lista-mis-rutas');

    // --- CARGAR RUTAS EN FORMATO DE TARJETAS ---
    async function cargarMisRutas() {
        try {
            if (contenedorMisRutas) contenedorMisRutas.innerHTML = '<p class="texto-descripcion">Cargando tus rutas...</p>';

            const respuesta = await fetch(`http://localhost:3000/api/envios?usuarios_idusuarios=${idUsuarioActual}`);
            let misEnvios = [];
            
            try {
                misEnvios = await respuesta.json();
            } catch (e) {
                misEnvios = [];
            }

            if (!Array.isArray(misEnvios)) misEnvios = [];

            if (contenedorMisRutas) {
                contenedorMisRutas.innerHTML = '';
                
                if (misEnvios.length === 0) {
                    contenedorMisRutas.innerHTML = '<p class="texto-descripcion">No tienes rutas asignadas todavía.</p>';
                    return;
                }

                misEnvios.forEach(e => {
                    const tarjeta = document.createElement('div');
                    tarjeta.className = 'tarjeta-ruta';
                    tarjeta.style.cssText = 'background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px;';

                    tarjeta.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 6px;">
                            <span style="font-weight: bold; color: #5c3a40;">Envío #${e.idenvio}</span>
                            <span style="font-size: 0.9rem; color: #666;">Lote ID: ${e.pedidos_idpedidos}</span>
                        </div>
                        <p style="margin: 0; font-size: 0.95rem;"><strong>Lugar de recepción (Salida):</strong> ${e.direccionsalida || 'N/A'}</p>
                        <p style="margin: 0; font-size: 0.95rem;"><strong>Dirección de destino:</strong> ${e.direcciondestinos || e.direcciondestino || 'N/A'}</p>
                        <p style="margin: 0; font-size: 0.85rem; color: #888;">Fecha: ${e.fecha || 'N/A'}</p>
                    `;
                    contenedorMisRutas.appendChild(tarjeta);
                });
            }

        } catch (error) {
            console.error('Error al cargar mis rutas:', error);
            if (contenedorMisRutas) {
                contenedorMisRutas.innerHTML = '<p style="color: red;">Error al cargar las rutas asignadas.</p>';
            }
        }
    }

    await cargarMisRutas();
});