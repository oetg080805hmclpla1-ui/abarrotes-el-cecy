document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;

    // Toast de notificaciones
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    // Modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    let onConfirmCallback = null;

    function openModal(message, callback) {
        if (!confirmModal) return;
        modalMessage.textContent = message;
        confirmModal.style.display = 'block';
        onConfirmCallback = callback;
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (onConfirmCallback) onConfirmCallback();
            confirmModal.style.display = 'none';
        });
    }

    // 1. Eliminar un producto de la lista
    document.querySelectorAll('.btn-remove-wishlist').forEach(button => {
        button.addEventListener('click', function () {
            const productId = this.getAttribute('data-product-id');

            openModal('¿Deseas eliminar este producto de tu lista de deseos?', function () {
                fetch(`/eliminar-lista-deseo/${productId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast(data.message, 'success');
                        const itemCard = document.querySelector(`.wishlist-item[data-product-id="${productId}"]`);
                        if (itemCard) itemCard.remove();

                        if (data.total_deseos === 0) {
                            window.location.reload();
                        } else {
                            const countSpan = document.getElementById('wishlistCount');
                            if (countSpan) countSpan.textContent = `(${data.total_deseos})`;
                        }
                    } else {
                        showToast(data.message || 'Error al eliminar', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Error de conexión', 'error');
                });
            });
        });
    });

    // 2. Mover producto al carrito
    document.querySelectorAll('.btn-move-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const productId = this.getAttribute('data-product-id');

            fetch(`/mover-al-carrito/${productId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    const itemCard = document.querySelector(`.wishlist-item[data-product-id="${productId}"]`);
                    if (itemCard) itemCard.remove();

                    if (data.data && data.data.total_deseos === 0) {
                        window.location.reload();
                    } else if (data.data) {
                        const countSpan = document.getElementById('wishlistCount');
                        if (countSpan) countSpan.textContent = `(${data.data.total_deseos})`;
                    }
                } else {
                    showToast(data.message || 'Error al mover producto', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Error de conexión', 'error');
            });
        });
    });

    // 3. Vaciar lista completa
    const clearWishlistBtn = document.getElementById('clearWishlistBtn');
    if (clearWishlistBtn) {
        clearWishlistBtn.addEventListener('click', function () {
            openModal('¿Estás seguro de que deseas vaciar toda la lista de deseos?', function () {
                fetch('/vaciar-lista/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        showToast(data.message || 'Error al vaciar la lista', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Error de conexión', 'error');
                });
            });
        });
    }
});