$(document).ready(function () {
    console.log("carrito.js cargado");
    

    const csrftoken = getCSRFToken();  // ¡Ahora esta función existe!

    function getCSRFToken() {
        let csrfToken = '';
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith('csrftoken=')) {
                csrfToken = cookie.substring('csrftoken='.length, cookie.length);
                break;
            }
        }
        return csrfToken;
    }

    // ========== FUNCIONES AUXILIARES ==========

    function formatearMoneda(valor) {
        return '$' + parseFloat(valor).toFixed(2);
    }

    function mostrarToast(tipo, mensaje) {
        // Eliminar la referencia a mostrarNotificacion
        const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
        const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';

        const notif = document.createElement('div');
        notif.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        notif.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notif.innerHTML = `
        <i class="fas ${icon} me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

        document.body.appendChild(notif);

        // Inicializar el componente de Bootstrap
        const bsAlert = new bootstrap.Alert(notif);

        // Remover después de 4 segundos
        setTimeout(() => {
            if (notif.parentNode) {
                bsAlert.close();
            }
        }, 4000);
    }

    function manejarErrorAJAX(xhr, boton = null) {
        let mensaje = 'Error al conectar con el servidor';
        if (xhr.responseJSON && xhr.responseJSON.message) {
            mensaje = xhr.responseJSON.message;
        }
        mostrarToast('error', mensaje);
        if (boton) {
            boton.prop('disabled', false);
            boton.html(boton.data('original-text') || 'Intentar de nuevo');
        }
    }

    function actualizarContadorCarrito(total) {
        let contador = $('.cart-count');
        if (contador.length) {
            contador.text(total);
        } else if (total > 0) {
            // Si no existe el contador, crearlo
            $('.fa-cart-shopping').parent().append(`<span class="cart-count">${total}</span>`);
        }
    }

    function recalcularTotalesPagina() {
        let subtotal = 0;

        // Sumar todos los subtotales
        $('[id^="subtotal-"]').each(function () {
            const valor = $(this).text().replace('$', '');
            subtotal += parseFloat(valor);
        });

        // Actualizar valores en la página
        $('#subtotal-total').text(formatearMoneda(subtotal));

        const impuestos = subtotal * 0.15;
        $('#impuestos').text(formatearMoneda(impuestos));

        const totalFinal = subtotal + impuestos;
        $('#total-final').text(formatearMoneda(totalFinal));

        return subtotal;
    }

    // ========== FUNCIÓN PARA ELIMINAR PRODUCTO ==========

    function eliminarProducto(productoId, fila) {
        const nombreProducto = fila.data('producto-nombre') || 'este producto';

        if (confirm(`¿Eliminar "${nombreProducto}" del carrito?`)) {
            $.ajax({
                url: `/eliminar_carrito/${productoId}/`,
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrftoken
                },
                success: function (response) {
                    if (response.success) {
                        mostrarToast('success', response.message);

                        // Eliminar fila con animación
                        fila.fadeOut(300, function () {
                            $(this).remove();

                            // Recalcular totales
                            recalcularTotalesPagina();

                            // Actualizar contador en navbar
                            if (response.data && response.data.total_items !== undefined) {
                                actualizarContadorCarrito(response.data.total_items);
                                
                            }

                            // Si no quedan productos, recargar página
                            if ($('#tabla-carrito tr').length === 0) {
                                setTimeout(() => location.reload(), 500);
                            }
                        });
                    }
                },
                error: function (xhr) {
                    manejarErrorAJAX(xhr);
                }
            });
        }
    }

    // ========== FUNCIÓN PARA ACTUALIZAR CANTIDAD ==========

    function actualizarCantidad(productoId, nuevaCantidad) {
        const fila = $(`#fila-${productoId}`);
        const input = fila.find('.cantidad-input');

        return $.ajax({
            url: `/cambiar_cantidad/${productoId}/`,
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken
            },
            data: { cantidad: nuevaCantidad },
            success: function (response) {
                if (response.success) {
                    // Actualizar subtotal en la fila
                    const precio = parseFloat(fila.find('.precio-unitario').data('precio'));
                    const nuevoSubtotal = precio * nuevaCantidad;
                    $(`#subtotal-${productoId}`).text(formatearMoneda(nuevoSubtotal));

                    // Recalcular totales de la página
                    recalcularTotalesPagina();

                    // Actualizar contador en navbar
                    if (response.data && response.data.total_items !== undefined) {
                        actualizarContadorCarrito(response.data.total_items);
                    }

                    // Si el producto fue eliminado (cantidad = 0)
                    if (response.data && response.data.item_eliminado) {
                        fila.fadeOut(300, function () {
                            $(this).remove();
                            if ($('#tabla-carrito tr').length === 0) {
                                setTimeout(() => location.reload(), 500);
                            }
                        });
                    }

                    mostrarToast('success', response.message);
                }
            },
            error: function (xhr) {
                manejarErrorAJAX(xhr);
                // Revertir valor en el input
                const cantidadActual = fila.find('.cantidad-input').data('last-valid-value') || 1;
                input.val(cantidadActual);
            }
        });
    }

    // ========== EVENTOS PARA CANTIDADES ==========

    // Guardar valor actual antes de cambiar
    $('.cantidad-input').each(function () {
        $(this).data('last-valid-value', $(this).val());
    });

    // Aumentar cantidad (+)
    $(document).on('click', '.btn-aumentar', function () {
        const fila = $(this).closest('tr');
        const productoId = fila.data('producto-id');
        const input = fila.find('.cantidad-input');
        let cantidad = parseInt(input.val());
        const max = parseInt(input.attr('max')) || 99;

        if (cantidad < max) {
            cantidad++;
            input.val(cantidad);
            input.data('last-valid-value', cantidad);
            actualizarCantidad(productoId, cantidad);
        } else {
            mostrarToast('warning', 'Límite máximo alcanzado');
        }
    });

    // Disminuir cantidad (-)
    $(document).on('click', '.btn-disminuir', function () {
        const fila = $(this).closest('tr');
        const productoId = fila.data('producto-id');
        const input = fila.find('.cantidad-input');
        let cantidad = parseInt(input.val());

        if (cantidad > 1) {
            cantidad--;
            input.val(cantidad);
            input.data('last-valid-value', cantidad);
            actualizarCantidad(productoId, cantidad);
        } else if (cantidad === 1) {
            // Si cantidad es 1 y presiona disminuir, preguntar eliminar
            eliminarProducto(productoId, fila);
        }
    });

    // Cambio manual en input
    $(document).on('change', '.cantidad-input', function () {
        const fila = $(this).closest('tr');
        const productoId = fila.data('producto-id');
        let cantidad = parseInt($(this).val());
        const max = parseInt($(this).attr('max')) || 99;

        // Validar
        if (isNaN(cantidad) || cantidad < 1) {
            cantidad = 1;
        }

        if (cantidad > max) {
            cantidad = max;
        }

        $(this).val(cantidad);
        $(this).data('last-valid-value', cantidad);

        if (cantidad === 0) {
            eliminarProducto(productoId, fila);
        } else {
            actualizarCantidad(productoId, cantidad);
        }
    });

    // Eliminar producto del carrito (botón basura)
    $(document).on('click', '.btn-eliminar', function () {
        const productoId = $(this).data('producto-id');
        const fila = $(this).closest('tr');
        eliminarProducto(productoId, fila);
    });

    // ========== VACIAR CARRITO COMPLETO ==========

    $('#vaciar-carrito').click(function () {
        const productos = $('#tabla-carrito tr');

        if (productos.length === 0) {
            mostrarToast('warning', 'El carrito ya está vacío');
            return;
        }

        if (confirm('¿Estás seguro de vaciar todo el carrito? Esta acción no se puede deshacer.')) {
            const boton = $(this);
            const originalText = boton.html();

            boton.html('<i class="fas fa-spinner fa-spin"></i> Vaciando...');
            boton.prop('disabled', true);

            // Usar la nueva vista de vaciar-carrito (más eficiente)
            $.ajax({
                url: '/vaciar-carrito/',
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrftoken
                },
                success: function (response) {
                    if (response.success) {
                        mostrarToast('success', response.message);
                        actualizarContadorCarrito(0);
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        mostrarToast('error', response.message || 'Error al vaciar carrito');
                        boton.html(originalText);
                        boton.prop('disabled', false);
                    }
                },
                error: function (xhr) {
                    // Si no existe la vista /vaciar-carrito/, eliminar uno por uno
                    let eliminados = 0;
                    const totalProductos = productos.length;

                    productos.each(function () {
                        const productoId = $(this).data('producto-id');

                        $.ajax({
                            url: `/eliminar_carrito/${productoId}/`,
                            method: 'POST',
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                                'X-CSRFToken': csrftoken
                            },
                            success: function () {
                                eliminados++;

                                if (eliminados === totalProductos) {
                                    mostrarToast('success', 'Carrito vaciado correctamente');
                                    actualizarContadorCarrito(0);
                                    setTimeout(() => location.reload(), 500);
                                }
                            },
                            error: function () {
                                boton.html(originalText);
                                boton.prop('disabled', false);
                                manejarErrorAJAX(xhr);
                                return false; // Detener el bucle
                            }
                        });
                    });
                }
            });
        }
    });


    // ========== PROCEDER CON LA COMPRA ==========

    $('#proceder-compra').click(function () {
        console.log("🎯 Botón 'Proceder con la compra' clickeado");

        const boton = $(this);
        const originalText = boton.html();

        // Verificar que haya productos
        if ($('#tabla-carrito tr').length === 0) {
            console.log("⚠️ Carrito vacío");
            mostrarToast('warning', 'Agrega productos al carrito antes de continuar');
            return;
        }

        console.log("✅ Carrito tiene productos, redirigiendo a checkout...");
        boton.html('<i class="fas fa-spinner fa-spin"></i> Redirigiendo...');

        // Redirigir a la página de checkout
        setTimeout(function () {
            window.location.href = '/checkout/';
        }, 500);
    });
    // ========== ACTUALIZAR CANTIDAD CON TECLADO ==========

    // Permitir solo números en los inputs de cantidad
    $(document).on('keypress', '.cantidad-input', function (e) {
        const charCode = e.which ? e.which : e.keyCode;

        // Solo permitir números (0-9) y teclas de control
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            e.preventDefault();
            return false;
        }

        // Limitar a 2 dígitos
        const currentValue = $(this).val();
        if (currentValue.length >= 2 && charCode !== 8 && charCode !== 46) {
            e.preventDefault();
            return false;
        }

        return true;
    });

    // Actualizar al presionar Enter
    $(document).on('keyup', '.cantidad-input', function (e) {
        if (e.keyCode === 13) { // Enter
            $(this).trigger('change');
        }
    });

    // ========== INICIALIZACIÓN ==========

    console.log(`📦 Carrito inicializado: ${$('#tabla-carrito tr').length} productos`);

    // Agregar tooltips a los botones
    $('[title]').tooltip({
        trigger: 'hover',
        placement: 'top'
    });
});