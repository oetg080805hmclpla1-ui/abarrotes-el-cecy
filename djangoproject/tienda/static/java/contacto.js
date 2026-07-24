document.addEventListener('DOMContentLoaded', function () {
    const contactoForm = document.getElementById('contactoForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // Función para mostrar/ocultar loading
    function mostrarLoading(mostrar) {
        if (mostrar) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = '';
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'ENVIAR MENSAJE';
        }
    }

    // Función para mostrar mensaje de éxito
    function mostrarExito() {
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        contactoForm.reset();

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    // Función para mostrar error
    function mostrarError(mensaje) {
        errorText.textContent = mensaje;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // Envío del formulario
    contactoForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validar formulario
        if (!contactoForm.checkValidity()) {
            mostrarError('Por favor, complete todos los campos requeridos.');
            return;
        }

        // Preparar datos
        const contactoData = {
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim() || 'No proporcionado',
            asunto: document.getElementById('asunto').value,
            mensaje: document.getElementById('mensaje').value.trim(),
            fecha: new Date().toISOString(),
            ip: '{{ request.META.REMOTE_ADDR }}'
        };

        // Mostrar loading
        mostrarLoading(true);

        // Simular envío (para demostración)
        setTimeout(() => {
            mostrarLoading(false);

            // Simular éxito (90% de probabilidad)
            if (Math.random() > 0.1) {
                mostrarExito();
                console.log('📧 Mensaje de contacto:', contactoData);
            } else {
                mostrarError('Error de conexión. Por favor, intente nuevamente.');
            }
        }, 1500);

        // En producción, descomenta esto:

    });

    // Validación en tiempo real
    contactoForm.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', function () {
            submitBtn.disabled = !contactoForm.checkValidity();
        });
    });

    // Efecto visual para botón
    submitBtn.addEventListener('mouseenter', function () {
        if (!this.disabled) {
            this.style.transform = 'translateY(-3px)';
        }
    });

    submitBtn.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
    });
});