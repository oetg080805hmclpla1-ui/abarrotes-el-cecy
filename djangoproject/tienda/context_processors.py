def carrito_context(request):
    """Añade contadores de carrito y lista de deseos a todos los templates"""
    from .deseos_manager import DeseosManager

    context = {}

    # DEBUG
    print(f"\n🎯 CONTEXT PROCESSOR:")
    print(f"   Session keys: {list(request.session.keys())}")
    print(f"   Tiene 'lista-deseos': {'lista-deseos' in request.session}")
    print(f"   Tiene 'lista_deseos': {'lista_deseos' in request.session}")

    # Calcular items en carrito
    carrito = request.session.get("carrito", {})
    context["carrito_count"] = sum(carrito.values())

    # Calcular items en lista de deseos
    if "gmail" in request.session:
        lista_deseos = DeseosManager.obtener_de_mongo(request.session["gmail"])
        print(f"   Usuario logueado: {request.session['gmail']}")
    else:
        # IMPORTANTE: usar 'lista-deseos' (con guion)
        lista_deseos = request.session.get("lista-deseos", [])
        print(f"   Usuario NO logueado")

    print(f"   Lista deseos obtenida: {lista_deseos}")
    print(f"   Cantidad: {len(lista_deseos)}")

    context["lista_deseos_count"] = len(lista_deseos)
    context["lista_deseos"] = lista_deseos

    return context
