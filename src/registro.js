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
        const respuesta = await fetch('http://localhost:3000/api/registro', {
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

            // Opcional: Redirigir al inicio de sesión después de 2 segundos para que el admin lo valide
            setTimeout(() => {
                window.location.href = './iniciosesion.html';
            }, 2000);
        } else {
            mensajeRegistro.style.color = 'red';
            mensajeRegistro.textContent = resultado.error || 'No se pudo registrar.';
            
            // Si hubo un error del servidor, volvemos a habilitar el botón para que pueda corregir
            rehabilitarBoton();
        }

    } catch (error) {
        console.error('Error de conexión:', error);
        mensajeRegistro.style.color = 'red';
        mensajeRegistro.textContent = 'Error al conectar con el servidor.';
        
        // Volvemos a habilitar el botón si falla la conexión
        rehabilitarBoton();
    }
});

function rehabilitarBoton() {
    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.style.cursor = 'pointer';
        btnSubmit.textContent = 'Registrarse'; // Cambia esto si tu botón tenía otro texto original
    }
}