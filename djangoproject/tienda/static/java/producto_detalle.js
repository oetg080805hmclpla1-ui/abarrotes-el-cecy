$(document).ready(function () {
    // Función simple para toast
    function mostrarToast(tipo, mensaje) {
        // Versión super simple - usa alert temporalmente
        console.log(`[${tipo}] ${mensaje}`);
        alert(mensaje); // Temporal - quitar cuando tengas toast implementado
    }

    // Función para CSRF token
    function getCSRFToken() {
        const cookie = document.cookie.match(/csrftoken=([^;]+)/);
        return cookie ? cookie[1] : '';
    }

    // Agregar a lista de deseos - VERSIÓN CORREGIDA
    $('.btn-agregar-deseo').click(function (e) {
        e.preventDefault();

        const productoId = $(this).data('producto-id');
        const boton = $(this);
        const originalText = boton.html();

        console.log("Agregando a lista de deseos ID:", productoId);

        if (!productoId) {
            mostrarToast('error', "ID inválido");
            return;
        }

        boton.html('<i class="fas fa-spinner fa-spin"></i> Agregando...');
        boton.prop('disabled', true);

        $.ajax({
            url: `/agregar-lista-deseo/${productoId}/`,
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken()
            },
            success: function (response) {
                console.log("Respuesta:", response);

                if (response.success) {
                    mostrarToast('success', response.message);

                    // Cambiar botón inmediatamente
                    boton.html('<i class="fas fa-heart text-danger"></i>');
                    boton.removeClass('btn-outline-danger').addClass('btn-danger');
                    boton.prop('disabled', true);
                    boton.attr('title', 'Ya está en tu lista de deseos');

                    // Actualizar contador
                    const counter = $('#wishlistCount, .wishlist-count, #headerWishlistCount');
                    if (counter.length) {
                        counter.text(response.total_deseos);
                        counter.css('display', response.total_deseos > 0 ? 'inline' : 'none');
                    }

                    // Recargar la página después de 1 segundo para asegurar cambios
                    setTimeout(() => {
                        location.reload();
                    }, 1000);

                } else {
                    mostrarToast('warning', response.message);
                    boton.html(originalText);
                    boton.prop('disabled', false);
                }
            },
            error: function (xhr) {
                console.error("Error completo:", xhr);
                mostrarToast('error', 'Error del servidor: ' + xhr.status);
                boton.html(originalText);
                boton.prop('disabled', false);
            }
        });
    });
});