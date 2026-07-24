from django.urls import path
from . import views

urlpatterns = [
    # General / Autenticación
    path("", views.menu, name="menu"),
    path("index/", views.index, name="index"),
    path("registro/", views.registro, name="registro"),
    path("cerrar/", views.cerrarSes, name="cerrar"),
    path("perfil/", views.perfil, name="perfil"),
    path("soporte/", views.acerca, name="soporte"),
    path("contacto/", views.contacto, name="contacto"),

    # Productos y Catálogo
    path("productos/", views.productos, name="productos"),
    path("plantilla-produc/", views.plantilla, name="plantilla"),
    path("producto/<str:nombre>/", views.producto_detalle, name="producto_detalle"),
    path("categoria/<slug:categoria>/", views.productos_por_categoria, name="productos_por_categoria"),
    path("diseños-premium/", views.disenos_premium_view, name="diseños_premium"),

    # Colecciones específicas
    path("coleccion-perfumes/", views.productos_por_categoria, {'categoria': 'fragancias-unicas'}, name='coleccion_perfumes'),
    path("coleccion-accesorios/", views.productos_por_categoria, {'categoria': 'accesorios-unicos'}, name='coleccion_accesorios'),
    path("coleccion-calzado/", views.productos_por_categoria, {'categoria': 'calzados-unicos'}, name='coleccion_calzado'),

    # Carrito
    path("carrito/", views.carrito, name="carrito"),
    path("agregar_carrito/<str:producto_id>/", views.agregar_carrito, name="agregar_carrito"),
    path("cambiar_cantidad/<str:producto_id>/", views.cambiar_cantidad, name="cambiar_cantidad"),
    path("eliminar_carrito/<str:producto_id>/", views.eliminar_carrito, name="eliminar_carrito"),
    path("vaciar-carrito/", views.vaciar_carrito, name="vaciar_carrito"),

    # Lista de deseos
    path("lista-deseos/", views.lista_deseos, name="lista-deseos"),
    path("agregar-lista-deseo/<str:producto_id>/", views.agregar_lista_deseo, name="agregar_lista_deseo"),
    path("eliminar-lista-deseo/<str:producto_id>/", views.eliminar_lista_deseo, name="eliminar_lista_deseo"),
    path("mover-al-carrito/<str:producto_id>/", views.mover_al_carrito, name="mover_al_carrito"),
    path("vaciar-lista/", views.vaciar_lista, name="vaciar_lista"),

    # Checkout y Órdenes
    path('checkout/', views.checkout, name='checkout'),
    path('procesar-compra/', views.procesar_compra, name='procesar_compra'),
    path('orden/<str:orden_id>/', views.orden_detalle, name='orden_detalle'),

    # Citas
    path('agendar-cita/', views.agendar_cita, name='agendar_cita'),
    path('api/procesar-cita/', views.procesar_cita, name='procesar_cita'),
    path('api/horarios-disponibles/', views.obtener_horarios_disponibles, name='horarios_disponibles'),
]