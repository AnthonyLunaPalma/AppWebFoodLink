document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const mensajeLogin = document.getElementById('mensaje-login');

    if (!formLogin) {
        console.error("No se encontró el formulario con ID 'form-login'");
        return;
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        const cuentaInput = document.getElementById('login-cuenta');
        const contrasenaInput = document.getElementById('login-contrasena');

        if (!cuentaInput || !contrasenaInput) {
            console.error("Faltan campos de entrada en el HTML.");
            return;
        }

        const cuenta = cuentaInput.value.trim();
        const contrasena = contrasenaInput.value.trim();

        try {
            // 1. Hacemos la petición al backend
            const respuesta = await peticion("/login", "POST", { cuenta, contrasena });
            console.log("Respuesta del servidor:", respuesta); // Para ver qué devuelve exactamente

            // 2. Extraemos los datos de forma ultra segura usando optional chaining (?.)
            const usuarioData = respuesta?.usuario || respuesta?.data || respuesta;
            const tokenData = respuesta?.token || "token-dummy";

            if (!usuarioData) {
                throw new Error("El servidor no devolvió los datos del usuario.");
            }

            // 3. Guardamos la sesión
            guardarSesion(tokenData, usuarioData);

            // 4. Obtenemos el ID del rol de forma segura
            const rolId = Number(usuarioData?.rol_idrol ?? usuarioData?.rol ?? 0);

            // 5. Redirigimos según el rol
            if (rolId === 1) {
                window.location.href = 'donador.html';
            } else if (rolId === 2) {
                window.location.href = 'receptor.html';
            } else if (rolId === 3) {
                window.location.href = 'voluntario.html';
            } else if (rolId === 4) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = '../index.html';
            }

        } catch (error) {
            console.error('Error en la autenticación:', error);
            if (mensajeLogin) {
                mensajeLogin.style.color = 'red';
                mensajeLogin.textContent = error.message || 'Credenciales incorrectas o error al conectar.';
            }
        }
    });
});