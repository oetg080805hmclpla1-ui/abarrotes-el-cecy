const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const btnAbrir = document.getElementById("btnAbrir");
const btnCerrar = document.getElementById("btnCerrar");

btnAbrir.onclick = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
};

btnCerrar.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
};

/* Si se toca el fondo oscuro, cerrar */
overlay.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
};

/* SUBMENÚS */
document.querySelectorAll(".submenu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const submenu = btn.nextElementSibling;
        submenu.classList.toggle("active");

        btn.querySelector("i").classList.toggle("rotado");
    });
});

/* COLAPSAR MENÚ (si quieres activarlo con tecla C) */
document.addEventListener("keydown", e => {
    if (e.key === "c") {
        sidebar.classList.toggle("mini");
    }
});
    
document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar todos los botones desplegables dentro del sidebar
    const submenuBtns = document.querySelectorAll('.sidebar .submenu-btn');

    submenuBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Obtener el li contenedor (.submenu-item)
            const parentItem = btn.closest('.submenu-item');
            
            if (parentItem) {
                // Alternar la clase 'active' para abrir o cerrar
                parentItem.classList.toggle('active');
            }
        });
    });
});