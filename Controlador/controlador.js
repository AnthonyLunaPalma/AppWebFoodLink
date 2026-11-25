const API_URL = "https://appwebfoodlink.onrender.com/api";
const MODO_DEMO = false;

// Roles
const ROLES_BD = { 1: "Donador", 2: "Receptor", 3: "Voluntario", 4: "Admin" };

async function eliminarUsuario(id) {
    if (!MODO_DEMO) return peticion("/usuarios/" + id, "DELETE");
}

// ==========================================
// GESTIÓN DE SESIÓN (Aislada por pestaña con sessionStorage)
// ==========================================
function guardarSesion(token, usuario) {
    sessionStorage.setItem("fl_token", token);
    sessionStorage.setItem("fl_usuario", JSON.stringify(usuario));
}

function obtenerSesion() {
    const u = sessionStorage.getItem("fl_usuario");
    return u ? JSON.parse(u) : null;
}

function obtenerToken() { 
    return sessionStorage.getItem("fl_token"); 
}

function cerrarSesion() {
    sessionStorage.removeItem("fl_token");
    sessionStorage.removeItem("fl_usuario");
}

// Obtener lotes filtrados por sesión (Admin ve todo, Donador solo los suyos)
async function listarLotesDonador() {
    if (!MODO_DEMO) {
        const sesion = obtenerSesion();
        // Si es Administrador (rol_idrol 4), puede ver todos los registros
        if (sesion && Number(sesion.rol_idrol) === 4) {
            return peticion("/pedidos");
        }
        // Si es Donador, filtramos estrictamente por su ID de usuario
        return sesion ? peticion(`/pedidos?usuarios_idusuarios=${sesion.idusuarios}`) : [];
    }
    return [];
}

async function rechazarUsuario(id) {
    if (!MODO_DEMO) return peticion("/usuarios/" + id + "/rechazar", "POST");
}

async function listarUsuariosPendientes() {
    if (!MODO_DEMO) return peticion("/usuarios/pendientes");
    return [];
}

async function aprobarUsuario(id) {
    if (!MODO_DEMO) return peticion("/usuarios/" + id + "/aprobar", "POST");
}

// Estados del lote / ruta
const ESTADOS = {
    PUBLICADO: "PUBLICADO",
    ACEPTADO: "ACEPTADO",
    ASIGNADO: "ASIGNADO",
    EN_RUTA: "EN_RUTA",
    EN_CONFIRMACION: "EN_CONFIRMACION",
    ENTREGADO: "ENTREGADO",
    RECHAZADO: "RECHAZADO",
    CADUCADO: "CADUCADO"
};

const TIPOS_BD = [
    { idtipos: 1, tipo: "Lácteos y derivados" },
    { idtipos: 2, tipo: "Carnes, pescados y huevos" },
    { idtipos: 3, tipo: "Legumbres, frutos secos y semillas" },
    { idtipos: 4, tipo: "Verduras y hortalizas" },
    { idtipos: 5, tipo: "Frutas" },
    { idtipos: 6, tipo: "Cereales y tubérculos" },
    { idtipos: 7, tipo: "Grasas y aceites" },
    { idtipos: 8, tipo: "Azúcares y dulces"
}];

// Petición genérica con cabecera de autorización
async function peticion(ruta, metodo = "GET", cuerpo = null, esFormData = false) {
    const opciones = { method: metodo, headers: {} };
    const token = obtenerToken();
    if (token) opciones.headers["Authorization"] = "Bearer " + token;
    if (cuerpo) {
        if (esFormData) {
            opciones.body = cuerpo;
        } else {
            opciones.headers["Content-Type"] = "application/json";
            opciones.body = JSON.stringify(cuerpo);
        }
    }
    let resp;
    try {
        resp = await fetch(API_URL + ruta, opciones);
    } catch (e) {
        throw new Error("No se pudo conectar con el servidor. ¿Está encendido el backend?");
    }
    if (resp.status === 204) return {};
    const datos = await resp.json().catch(() => ({}));
    
    if (resp.status === 401 && token && ruta !== "/login") {
        cerrarSesion();
        throw new Error("Tu sesión expiró. Recarga la página e inicia sesión de nuevo.");
    }

    if (!resp.ok) throw new Error(datos.error || datos.mensaje || "Error en el servidor");
    return datos;
}

// Autenticación
async function iniciarSesion(cuenta, contrasena) {
    if (!MODO_DEMO) {
        const r = await peticion("/login", "POST", { cuenta, contrasena });
        guardarSesion(r.token || "token-dummy", r.usuario);
        return r.usuario;
    }
}

// Publicar lote incluyendo automáticamente el ID del usuario en sesión
async function publicarLote(datos, foto) {
    const sesion = obtenerSesion();
    const usuarios_idusuarios = sesion ? sesion.idusuarios : null;

    if (!MODO_DEMO) {
        const fd = new FormData();
        Object.keys(datos).forEach(k => fd.append(k, k === "caducidad" ? new Date(datos[k]).toISOString() : datos[k]));
        
        if (usuarios_idusuarios) {
            fd.append("usuarios_idusuarios", usuarios_idusuarios);
        }
        
        if (foto) fd.append("foto", foto);
        return peticion("/pedidos", "POST", fd, true);
    }
}

async function listarUsuarios(busqueda = "") {
    if (!MODO_DEMO) {
        let url = "/usuarios";
        if (busqueda) url += "?busqueda=" + encodeURIComponent(busqueda);
        return peticion(url);
    }
    return [];
}
const formRegistro = document.getElementById('form-registro');
const mensajeRegistro = document.getElementById('mensaje-registro');
const btnSubmit = formRegistro.querySelector('button[type="submit"]') || formRegistro.querySelector('button');

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const rol = document.getElementById('registro-rol').value;
    const nombre = document.getElementById('registro-nombre').value;
    const correo = document.getElementById('registro-correo').value;
    const cuenta = document.getElementById('registro-cuenta').value;
    const contrasena = document.getElementById('registro-contrasena').value;
    const confirmar = document.getElementById('registro-confirmar').value;

    // Validación local del correo usando expresiones regulares
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo.trim())) {
        mensajeRegistro.style.color = 'red';
        mensajeRegistro.textContent = 'Por favor, ingresa un correo electrónico válido.';
        return;
    }

    if (contrasena !== confirmar) {
        mensajeRegistro.style.color = 'red';
        mensajeRegistro.textContent = 'Las contraseñas no coinciden.';
        return; 
    }

    // 1. DESHABILITAR EL BOTÓN PARA EVITAR MÚLTIPLES CLICS
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.6';
        btnSubmit.style.cursor = 'not-allowed';
        btnSubmit.textContent = 'Registrando...';
    }

    try {
        const respuesta = await fetch('https://appwebfoodlink.onrender.com/api/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rol, nombre, correo, cuenta, contrasena })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mensajeRegistro.style.color = 'green';
            mensajeRegistro.textContent = resultado.mensaje; 
            formRegistro.reset(); 

            // Redirigir al inicio de sesión después de 2 segundos para que el admin lo valide
            setTimeout(() => {
                window.location.href = './iniciosesion.html';
            }, 2000);
        } else {
            mensajeRegistro.style.color = 'red';
            mensajeRegistro.textContent = resultado.error || 'No se pudo registrar.';
            rehabilitarBoton();
        }

    } catch (error) {
        console.error('Error de conexión:', error);
        mensajeRegistro.style.color = 'red';
        mensajeRegistro.textContent = 'Error al conectar con el servidor.';
        rehabilitarBoton();
    }
});

function rehabilitarBoton() {
    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.style.cursor = 'pointer';
        btnSubmit.textContent = 'Registrarse';
    }
}