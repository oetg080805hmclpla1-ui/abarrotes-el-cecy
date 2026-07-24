$(document).ready(function () {

    function getCSRFToken() {
        // Método más simple para obtener CSRF token
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
               document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
    }

    const csrftoken = getCSRFToken();

    // Elementos del DOM
    const wishlistContainer = document.getElementById('wishlistContainer');
    const wishlistCount = document.getElementById('wishlistCount');
    const confirmModal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const toast = document.getElementById('toast');
    const clearWishlistBtn = document.getElementById('clearWishlistBtn');

    let pendingAction = null;
    let pendingProductId = null;

    // Inicializar contador
    updateWishlistCount();

    // Función para mostrar notificación
    function showToast(message, type = 'success') {
        if (!toast) {
            console.log(`${type}: ${message}`);
            return;
        }
        
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type);
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Función para mostrar modal de confirmación
    function showConfirmModal(message, action, productId = null) {
        modalMessage.textContent = message;
        pendingAction = action;
        pendingProductId = productId;
        confirmModal.style.display = 'flex';
    }

    // Función para cerrar modal
    function closeModal() {
        confirmModal.style.display = 'none';
        pendingAction = null;
        pendingProductId = null;
    }

    // Función para actualizar contador
    function updateWishlistCount() {
        if (!wishlistCount) return;

        const wishlistItems = document.querySelectorAll('.wishlist-item');
        const count = wishlistItems.length;
        wishlistCount.textContent = `(${count})`;

        // Actualizar en el header si existe
        const headerWishlistCount = document.getElementById('headerWishlistCount');
        if (headerWishlistCount) {
            headerWishlistCount.textContent = count;
            headerWishlistCount.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    // Función para eliminar producto de la lista
    function removeFromWishlist(productId) {
        console.log(`Eliminando producto ${productId} de lista de deseos`);
        
        fetch(`/eliminar-lista-deseo/${productId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'csrfmiddlewaretoken': csrftoken
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta eliminación:", data);
            
            if (data.success) {
                // Remover elemento del DOM con animación
                const item = document.querySelector(`[data-product-id="${productId}"]`);
                if (item) {
                    item.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        item.remove();
                        updateWishlistCount();

                        // Si no quedan productos, recargar la página
                        const remainingItems = document.querySelectorAll('.wishlist-item').length;
                        if (remainingItems === 0) {
                            showToast('Tu lista de deseos está ahora vacía', 'info');
                            setTimeout(() => location.reload(), 1000);
                        }
                    }, 300);
                }

                showToast(data.message, 'success');
            } else {
                showToast(data.message || 'Error al eliminar producto', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error de conexión al servidor', 'error');
        });
    }

    // Función para mover al carrito
    function moveToCart(productId) {
        console.log(`Moviendo producto ${productId} al carrito`);
        
        fetch(`/mover-al-carrito/${productId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'csrfmiddlewaretoken': csrftoken
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta mover al carrito:", data);
            
            if (data.success) {
                // Actualizar contador del carrito en el header
                const cartCount = document.getElementById('cartCount');
                if (cartCount) {
                    cartCount.textContent = data.data.total_carrito;
                    cartCount.style.display = data.data.total_carrito > 0 ? 'inline' : 'none';
                }

                // Remover de la lista de deseos (después de mostrar mensaje)
                showToast(data.message, 'success');
                
                // Eliminar del DOM después de un breve delay
                setTimeout(() => {
                    removeFromWishlist(productId);
                }, 500);
                
            } else {
                showToast(data.message || 'Error al mover al carrito', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error de conexión al servidor', 'error');
        });
    }

    // Función para vaciar toda la lista
    function clearWishlist() {
        const items = document.querySelectorAll('.wishlist-item');
        
        if (items.length === 0) {
            showToast('Tu lista de deseos ya está vacía', 'warning');
            return;
        }

        showToast('Eliminando productos...', 'warning');

        // Crear array de promesas
        const promises = Array.from(items).map(item => {
            return fetch(`/vaciar-lista/`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'csrfmiddlewaretoken': csrftoken
                })
            });
        });

        // Ejecutar todas las promesas
        Promise.all(promises)
        .then(responses => {
            return Promise.all(responses.map(r => r.json()));
        })
        .then(results => {
            const allSuccess = results.every(r => r.success);
            if (allSuccess) {
                showToast('Lista de deseos vaciada correctamente', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Error al vaciar algunos productos', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error al vaciar la lista', 'error');
        });
    }

    // Event Listeners
    if (wishlistContainer) {
        // Delegación de eventos para botones dinámicos
        wishlistContainer.addEventListener('click', function (e) {
            // Eliminar de lista de deseos
            const removeBtn = e.target.closest('.btn-remove-wishlist');
            if (removeBtn) {
                const productId = removeBtn.dataset.productId;
                const productName = removeBtn.closest('.wishlist-item').querySelector('.product-name').textContent;

                showConfirmModal(
                    `¿Estás seguro de eliminar "${productName}" de tu lista de deseos?`,
                    'remove',
                    productId
                );
                e.stopPropagation();
            }

            // Mover al carrito
            const moveBtn = e.target.closest('.btn-move-to-cart');
            if (moveBtn) {
                const productId = moveBtn.dataset.productId;
                const productName = moveBtn.closest('.wishlist-item').querySelector('.product-name').textContent;

                showConfirmModal(
                    `¿Mover "${productName}" al carrito?`,
                    'moveToCart',
                    productId
                );
                e.stopPropagation();
            }
        });
    }

    // Vaciar lista de deseos
    if (clearWishlistBtn) {
        clearWishlistBtn.addEventListener('click', function () {
            const itemCount = document.querySelectorAll('.wishlist-item').length;
            if (itemCount > 0) {
                showConfirmModal(
                    `¿Estás seguro de vaciar toda tu lista de deseos? Se eliminarán ${itemCount} productos.`,
                    'clearAll'
                );
            } else {
                showToast('Tu lista de deseos ya está vacía', 'warning');
            }
        });
    }

    // Modal buttons
    confirmBtn.addEventListener('click', function () {
        if (pendingAction === 'remove' && pendingProductId) {
            removeFromWishlist(pendingProductId);
        } else if (pendingAction === 'moveToCart' && pendingProductId) {
            moveToCart(pendingProductId);
        } else if (pendingAction === 'clearAll') {
            clearWishlist();
        }
        closeModal();
    });

    cancelBtn.addEventListener('click', closeModal);

    // Cerrar modal haciendo clic fuera
    confirmModal.addEventListener('click', function (e) {
        if (e.target === confirmModal) {
            closeModal();
        }
    });

    // Agregar animación CSS para fade out
    if (!document.querySelector('#fadeOutStyle')) {
        const style = document.createElement('style');
        style.id = 'fadeOutStyle';
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }

    // Cerrar modal con ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && confirmModal.style.display === 'flex') {
            closeModal();
        }
    });

});