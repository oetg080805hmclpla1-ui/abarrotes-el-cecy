// Funcionalidades comunes para todas las páginas de productos

document.addEventListener('DOMContentLoaded', function () {
    // Animaciones de revelación
    const revealElements = document.querySelectorAll('.reveal-fade');

    const revealOnScroll = () => {
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Ejecutar al cargar

    // Funcionalidad de agregar al carrito
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const productId = this.getAttribute('data-producto-id');
            const productName = this.getAttribute('data-producto-nombre');

            // Aquí iría la lógica para agregar al carrito
            console.log('Agregando al carrito:', productId, productName);

            // Feedback visual
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Agregado';
            this.classList.remove('btn-primary');
            this.classList.add('btn-success');

            setTimeout(() => {
                this.innerHTML = originalText;
                this.classList.remove('btn-success');
                this.classList.add('btn-primary');
            }, 2000);
        });
    });

    // Manejo de filtros
    const filterProducts = () => {
        // Lógica de filtrado común
        console.log('Filtrando productos...');
    };
});