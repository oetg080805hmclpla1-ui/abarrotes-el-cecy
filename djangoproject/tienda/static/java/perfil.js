$(document).ready(function () {
    // Solo el sistema de tabs
    $('.tab-btn').click(function () {
        const tabId = $(this).data('tab');

        // Remover active de todos
        $('.tab-btn').removeClass('active');
        $('.tab-content').removeClass('active');

        // Agregar active al seleccionado
        $(this).addClass('active');
        $('#tab-' + tabId).addClass('active');
    });

    console.log('Perfil cargado');
});