document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.tienda li');
  const isMobile = window.innerWidth <= 800;

  const inicial = items[0];
  const inicialBtn = inicial.querySelector('button');
  inicial.classList.add('activo');
  inicialBtn.classList.add('oculto');

  items.forEach(item => {
    const button = item.querySelector('button');
    const link = item.querySelector('a');

    // Si es móvil, usar la imagen del button como portada en el <a>
    if (isMobile) {
      const bg = button.style.backgroundImage;
      link.style.backgroundImage = bg;
      link.style.backgroundSize = "cover";
      link.style.backgroundPosition = "center";
      link.style.display = "block";
      button.style.display = "none"; // ocultamos el button
    }

    button.addEventListener('click', () => {
      items.forEach(li => {
        li.classList.remove('activo');
        li.querySelector('button').classList.remove('oculto');
      });

      item.classList.add('activo');
      button.classList.add('oculto');
    });

    link.addEventListener('click', () => {
      item.classList.remove('activo');
      button.classList.remove('oculto');
    });
  });

  // Optional: actualizar al cambiar el tamaño de pantalla
  window.addEventListener('resize', () => {
    const mobile = window.innerWidth <= 800;
    items.forEach(item => {
      const button = item.querySelector('button');
      const link = item.querySelector('a');
      if (mobile) {
        const bg = button.style.backgroundImage;
        link.style.backgroundImage = bg;
        link.style.backgroundSize = "cover";
        link.style.backgroundPosition = "center";
        link.style.display = "block";
        button.style.display = "none";
      } else {
        link.style.backgroundImage = "";
        link.style.display = "none";
        button.style.display = "block";
      }
    });
  });
});
