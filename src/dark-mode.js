(function() {
    const applyTheme = (isDark) => {
        if (isDark) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    };

    const initDarkMode = () => {
        // 1. Insertar el switch flotante si no existe
        if (!document.getElementById('theme-switch-container')) {
            const switchContainer = document.createElement('div');
            switchContainer.id = 'theme-switch-container';
            switchContainer.className = 'theme-switch-wrapper';
            switchContainer.innerHTML = `
                <label for="checkbox-dark-mode">🌙 Modo Oscuro</label>
                <label class="theme-switch">
                    <input type="checkbox" id="checkbox-dark-mode">
                    <span class="slider"></span>
                </label>
            `;
            document.body.appendChild(switchContainer);
        }

        const toggleSwitch = document.getElementById('checkbox-dark-mode');
        const currentTheme = localStorage.getItem('theme');

        // 2. Aplicar el tema guardado en localStorage al cargar
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (toggleSwitch) toggleSwitch.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (toggleSwitch) toggleSwitch.checked = false;
        }

        // 3. Escuchar los cambios del switch
        if (toggleSwitch) {
            const newSwitch = toggleSwitch.cloneNode(true);
            toggleSwitch.parentNode.replaceChild(newSwitch, toggleSwitch);

            newSwitch.addEventListener('change', function(e) {
                applyTheme(e.target.checked);
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDarkMode);
    } else {
        initDarkMode();
    }
})();