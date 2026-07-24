$(document).ready(function () {
    const csrftoken = getCSRFToken();

    // ---------- AGREGAR AL CARRITO ----------
    $('.btn-agregar-carrito').click(function (e) {
        e.preventDefault();

        const boton = $(this);
        const productoId = boton.data('producto-id');
        const textoOriginal = boton.html();

        // Cambiar estado del botón
        boton.html('<i class="fas fa-spinner fa-spin"></i>');
        boton.prop('disabled', true);

        // Enviar petición AJAX
        $.ajax({
            url: `/agregar_carrito/${productoId}/`,
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken
            },
            success: function (response) {
                if (response.success) {
                    // Mostrar notificación
                    mostrarNotificacion('exito', response.message);

                    // Actualizar contador del carrito en el navbar
                    actualizarContadorCarrito(response.total_items);

                    // Cambiar botón a "Agregado" temporalmente
                    boton.html('<i class="fas fa-check"></i> Agregado');
                    boton.removeClass('btn-primary').addClass('btn-success');

                    // Restaurar después de 2 segundos
                    setTimeout(function () {
                        boton.html(textoOriginal);
                        boton.removeClass('btn-success').addClass('btn-primary');
                        boton.prop('disabled', false);
                    }, 2000);
                } else {
                    mostrarNotificacion('error', response.message);
                    boton.html(textoOriginal);
                    boton.prop('disabled', false);
                }
            },
            error: function (xhr) {
                mostrarNotificacion('error', 'Error al agregar al carrito');
                boton.html(textoOriginal);
                boton.prop('disabled', false);
            }
        });
    });

    // ---------- FUNCIONES AUXILIARES ----------
    function actualizarContadorCarrito(total) {
        let contador = $('.cart-count');
        if (contador.length) {
            contador.text(total);
        } else {
            // Si no existe el contador, crearlo
            $('.fa-shopping-cart').parent().append(`<span class="cart-count">${total}</span>`);
        }
    }



    



});