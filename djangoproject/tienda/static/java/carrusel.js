const slides = document.querySelectorAll('.content');
const modal = document.getElementById('modal');
const modalImagen = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDescripcion = document.getElementById('modal-descripcion');
const modalLink = document.getElementById('modal-link');
const closeModal = document.querySelector('.close');
//AQUI HACEMOS EL MODAL PARA QUE ABRA AL HACERLE CLICK A UNA IMAGEN
slides.forEach(slide => {
    slide.addEventListener('click', function () {
        modalImagen.src = this.querySelector('img').src;
        modalTitle.textContent = this.querySelector('img').getAttribute('data-title');
        modalDescripcion.textContent = this.querySelector('img').getAttribute('data-descripcion');
        modalLink.href = this.querySelector('img').getAttribute('data-link');
        modal.style.display = 'block';
    });
});
//AHORA PARA CERRAR EL MODAL
closeModal.addEventListener('click', function () {
    modal.style.display = 'none';
});
//Cerrar el modal al hacer click fuera del contenido
window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});