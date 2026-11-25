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
    
    const inputFile = document.getElementById('registro-documentos');
    const archivo = inputFile && inputFile.files[0] ? inputFile.files[0] : null;

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

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.6';
        btnSubmit.style.cursor = 'not-allowed';
        btnSubmit.textContent = 'Registrando...';
    }

    try {
        const formData = new FormData();
        formData.append('rol', rol);
        formData.append('nombre', nombre);
        formData.append('correo', correo);
        formData.append('cuenta', cuenta);
        formData.append('contrasena', contrasena);
        if (archivo) {
            formData.append('documentos', archivo);
        }

        const respuesta = await fetch('https://appwebfoodlink.onrender.com/api/registro', {
            method: 'POST',
            body: formData
        });
        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mensajeRegistro.style.color = 'green';
            mensajeRegistro.textContent = resultado.mensaje; 
            formRegistro.reset(); 

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