$(document).ready(function () {
    // FAQ Accordion
    $('.faq-pregunta').click(function () {
        const faqItem = $(this).parent();
        faqItem.toggleClass('active');
        $('.faq-item').not(faqItem).removeClass('active');
    });

    // Chat Modal
    const chatModal = document.getElementById('chatModal');
    const abrirChatBtn = document.getElementById('abrirChatBtn');
    const cerrarChatBtn = document.getElementById('cerrarChatBtn');
    const chatInput = document.getElementById('chatInput');
    const enviarChatBtn = document.getElementById('enviarChatBtn');
    const chatBody = document.getElementById('chatBody');

    if (abrirChatBtn) {
        abrirChatBtn.addEventListener('click', () => {
            const ahora = new Date();
            const hora = ahora.getHours();
            const dia = ahora.getDay(); // 0 = Domingo, 1-5 = Lunes-Viernes

            if (dia >= 1 && dia <= 5 && hora >= 9 && hora < 18) {
                chatModal.style.display = 'flex';
            } else {
                alert('El chat está disponible de Lunes a Viernes de 9:00 AM a 6:00 PM');
            }
        });
    }

    if (cerrarChatBtn) {
        cerrarChatBtn.addEventListener('click', () => {
            chatModal.style.display = 'none';
        });
    }

    // Enviar mensaje de chat
    function enviarMensajeChat(mensaje, esUsuario = true) {
        const ahora = new Date();
        const hora = ahora.getHours().toString().padStart(2, '0');
        const minutos = ahora.getMinutes().toString().padStart(2, '0');

        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `chat-mensaje ${esUsuario ? 'chat-usuario' : 'chat-soporte'}`;

        mensajeDiv.innerHTML = `
            <div class="mensaje-contenido">
                ${esUsuario ? '<strong>Tú:</strong> ' : '<strong>Soporte:</strong> '}
                ${mensaje}
            </div>
            <div class="mensaje-hora">${hora}:${minutos}</div>
        `;

        chatBody.appendChild(mensajeDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Respuesta automática si es del usuario
        if (esUsuario) {
            setTimeout(() => {
                const respuestas = [
                    "Entiendo, déjame consultar eso para ti...",
                    "Gracias por tu mensaje, en un momento te ayudo.",
                    "Voy a revisar esa información para darte una respuesta precisa.",
                    "Un momento por favor, estoy buscando la mejor solución para ti."
                ];
                const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
                enviarMensajeChat(respuesta, false);
            }, 1000);
        }
    }

    if (enviarChatBtn && chatInput) {
        enviarChatBtn.addEventListener('click', () => {
            const mensaje = chatInput.value.trim();
            if (mensaje) {
                enviarMensajeChat(mensaje, true);
                chatInput.value = '';
            }
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const mensaje = chatInput.value.trim();
                if (mensaje) {
                    enviarMensajeChat(mensaje, true);
                    chatInput.value = '';
                }
            }
        });
    }

    // Formulario de contacto
    const formContacto = document.getElementById('formContacto');
    if (formContacto) {
        formContacto.addEventListener('submit', function (e) {
            e.preventDefault();

            // Simular envío (en producción esto sería una petición AJAX real)
            const formData = new FormData(this);
            const nombre = formData.get('nombre');

            alert(`¡Gracias ${nombre}! Tu mensaje ha sido enviado. Te contactaremos en menos de 24 horas.`);
            this.reset();

            // En producción sería:
            // fetch('/enviar-contacto/', {
            //     method: 'POST',
            //     body: formData
            // }).then(...)
        });
    }

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function (e) {
        if (e.target === chatModal) {
            chatModal.style.display = 'none';
        }
    });

    // Cerrar con ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (chatModal.style.display === 'flex') {
                chatModal.style.display = 'none';
            }
        }
    });

    console.log('Ayuda JS cargado correctamente');
});