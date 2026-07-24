import json
import random
import string
from datetime import datetime
import re
import traceback

from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login, authenticate
from django.contrib.auth.models import User
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password

from bson import ObjectId
from bson.errors import InvalidId

from .forms import RegistroUsuarioForm
from .carrito_manager import CarritoManager
from .deseos_manager import DeseosManager
from .models import Producto

# ==================== FUNCIONES AUXILIARES ====================


def requiere_login(request):
    """Verifica si existe la sesión de usuario activa."""
    return "gmail" not in request.session and "email" not in request.session


def obtener_carrito(request):
    """Obtiene carrito inteligentemente de MongoDB o Sesión."""
    if "gmail" in request.session:
        carrito = CarritoManager.obtener_de_mongo(request.session["gmail"])
        CarritoManager.guardar_en_sesion(request, carrito)
        return carrito
    else:
        return CarritoManager.obtener_de_sesion(request)


def guardar_carrito_helper(request, carrito):
    """Guarda carrito en sesión y en MongoDB si el usuario está logueado."""
    CarritoManager.guardar_en_sesion(request, carrito)

    if "gmail" in request.session:
        CarritoManager.guardar_en_mongo(request.session["gmail"], carrito)

    return True


def limpiar_documento_mongo(documento):
    """Convierte un documento MongoDB a un diccionario serializable para JSON."""
    if not documento:
        return {}

    limpio = {}
    for key, value in documento.items():
        if key == "_id" or isinstance(value, ObjectId):
            limpio[key] = str(value)
        elif isinstance(value, datetime):
            limpio[key] = value.isoformat()
        elif isinstance(value, list):
            limpio[key] = [
                limpiar_documento_mongo(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, dict):
            limpio[key] = limpiar_documento_mongo(value)
        else:
            limpio[key] = value

    return limpio


# ==================== LOGIN / REGISTRO / PERFIL ====================


def index(request):
    if request.session.get("gmail") or request.session.get("email"):
        return redirect("menu")

    if request.method == "GET":
        return render(request, "index.html")

    gmail = request.POST.get("gmail", "").strip().lower()
    password = request.POST.get("password", "").strip()
    recordar = request.POST.get("recordarme")

    db = settings.MONGO_COLLECTION.database
    coleccion_auth = db["auth_user"]

    regex_correo = re.compile(f"^{re.escape(gmail)}$", re.IGNORECASE)

    usuario_existente = coleccion_auth.find_one({
        "$or": [
            {"email": regex_correo},
            {"gmail": regex_correo},
            {"username": regex_correo}
        ]
    })

    if not usuario_existente:
        return render(request, "index.html", {"error": "El correo no está registrado."})

    password_db = usuario_existente.get("password", "")
    es_valida = check_password(password, password_db) or password_db == password

    if es_valida:
        request.session["gmail"] = gmail
        request.session["username"] = usuario_existente.get("username", "")

        CarritoManager.migrar_sesion_a_mongo(request)
        DeseosManager.migrar_sesion_a_mongo(request)

        if recordar:
            request.session.set_expiry(60 * 60 * 24 * 7)
        else:
            request.session.set_expiry(0)

        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse({"success": True, "redirect": "/menu/"})

        return redirect("menu")
    else:
        return render(request, "index.html", {"error": "Correo y/o contraseña incorrecta."})


def registro(request):
    if request.method == "GET":
        return render(request, "registrarse.html")

    gmail = request.POST.get("gmail")
    username = request.POST.get("username")
    password1 = request.POST.get("password1")
    password2 = request.POST.get("password2")

    if password1 != password2:
        return render(request, "registrarse.html", {"error": "Las contraseñas no coinciden"})

    if settings.MONGO_COLLECTION.find_one({"gmail": gmail}):
        return render(request, "registrarse.html", {"error": "El correo ya está registrado"})

    usuario = {
        "username": username,
        "gmail": gmail,
        "password": password1,
        "fecha_registro": datetime.now(),
        "activo": True,
    }
    settings.MONGO_COLLECTION.insert_one(usuario)

    request.session["gmail"] = gmail
    request.session["username"] = username

    CarritoManager.migrar_sesion_a_mongo(request)
    DeseosManager.migrar_sesion_a_mongo(request)

    return redirect("menu")

# Alias por compatibilidad
registrar_usuario = registro


def cerrarSes(request):
    request.session.flush()
    response = redirect("index")
    response.delete_cookie("sessionid")
    return response


def perfil(request):
    if requiere_login(request):
        return redirect("index")
    
    gmail = request.session.get("gmail")
    usuario = settings.MONGO_COLLECTION.find_one({"gmail": gmail})
    
    return render(request, "perfil.html", {"usuario": usuario})


# ==================== PÁGINAS GENERALES ====================


def menu(request):
    productos = list(settings.PRODUCTOS_COLLECTION.find({}))
    for producto in productos:
        producto["id_str"] = str(producto.get("id", producto.get("_id")))

    return render(request, "menu.html", {"productos": productos})


def productos(request):
    categoria_nombre = request.GET.get('categoria', None)

    if categoria_nombre:
        productos_qs = Producto.objects.filter(categoria=categoria_nombre)
    else:
        productos_qs = Producto.objects.all()

    productos = []
    for prod in productos_qs:
        productos.append({
            'id_str': str(prod.id),
            'nombre': prod.nombre,
            'descripcion': prod.descripcion,
            'precio': float(prod.precio) if prod.precio else 0.0,
            'imagen': prod.imagen,
            'categoria': prod.categoria,
            'stock': prod.stock,
            'es_limitado': prod.es_limitado,
        })

    return render(request, "productos.html", {
        "productos": productos,
        "categoria_actual": categoria_nombre
    })


def acerca(request):
    return render(request, "ayuda_soporte.html")


def contacto(request):
    return render(request, "contacto.html")


def plantilla(request):
    query = request.GET.get("produc-search", "").strip()
    filtros = {}

    if query:
        filtros["nombre"] = {"$regex": query, "$options": "i"}

    productos = list(settings.PRODUCTOS_COLLECTION.find(filtros))

    for producto in productos:
        producto["id_str"] = str(producto.get("id", producto.get("_id")))

    return render(request, "plantilla-produc.html", {"productos": productos, "query": query})


def producto_detalle(request, nombre):
    """Busca producto tanto por ID como por Nombre en MongoDB o SQLite."""
    
    # 1. Intentar buscar por ORM SQLite primero
    producto_obj = Producto.objects.filter(nombre=nombre).first()
    if not producto_obj and nombre.isdigit():
        producto_obj = Producto.objects.filter(id=int(nombre)).first()

    if producto_obj:
        producto = {
            'id_str': str(producto_obj.id),
            'producto_id': str(producto_obj.id),
            'nombre': producto_obj.nombre,
            'descripcion': producto_obj.descripcion,
            'precio': float(producto_obj.precio) if producto_obj.precio else 0.0,
            'imagen': producto_obj.imagen,
            'categoria': producto_obj.categoria,
            'stock': producto_obj.stock,
            'es_limitado': producto_obj.es_limitado,
        }
        return render(request, "producto_detalle.html", {
            "producto": producto,
            "lista_deseos": request.session.get("lista-deseos", [])
        })

    # 2. Si no está en SQLite, buscar en MongoDB
    query = {"$or": [{"nombre": nombre}]}
    try:
        query["$or"].append({"id": int(nombre)})
    except ValueError:
        pass
        
    query["$or"].append({"id": str(nombre)})

    if ObjectId.is_valid(nombre):
        query["$or"].append({"_id": ObjectId(nombre)})

    producto = settings.PRODUCTOS_COLLECTION.find_one(query)

    if not producto:
        messages.error(request, 'Producto no encontrado.')
        return redirect('productos')

    producto['id_str'] = str(producto.get('id', producto.get('_id')))
    if '_id' in producto:
        producto['_id'] = str(producto['_id'])

    return render(request, 'producto_detalle.html', {
        'producto': producto,
        'lista_deseos': request.session.get('lista-deseos', [])
    })


def productos_por_categoria(request, categoria):
    productos = list(settings.PRODUCTOS_COLLECTION.find({"categoria": categoria}))
    for producto in productos:
        producto["id_str"] = str(producto.get("id", producto.get("_id")))

    return render(
        request,
        "productos_por_categoria.html",
        {"categoria": categoria.replace("-", " ").title(), "productos": productos},
    )


def disenos_premium_view(request):
    productos = list(settings.PRODUCTOS_COLLECTION.find({"es_premium": True}))
    for producto in productos:
        producto["id_str"] = str(producto.get("id", producto.get("_id")))

    return render(request, "diseños_premium.html", {"productos": productos})


# ==================== CARRITO DE COMPRAS ====================


def agregar_carrito(request, producto_id):
    """Agrega un producto al carrito resolviendo el ID correctamente."""
    if request.method == "POST":
        query = {"$or": []}

        try:
            query["$or"].append({"id": int(producto_id)})
        except ValueError:
            pass

        query["$or"].append({"id": str(producto_id)})

        if ObjectId.is_valid(producto_id):
            query["$or"].append({"_id": ObjectId(producto_id)})

        # Buscar en Mongo
        producto = settings.PRODUCTOS_COLLECTION.find_one(query)

        # Si no está en Mongo, buscar en SQLite con el modelo Producto
        if not producto:
            prod_obj = None
            if producto_id.isdigit():
                prod_obj = Producto.objects.filter(id=int(producto_id)).first()
            if not prod_obj:
                prod_obj = Producto.objects.filter(nombre=producto_id).first()

            if prod_obj:
                producto = {
                    "id": str(prod_obj.id),
                    "nombre": prod_obj.nombre,
                    "precio": float(prod_obj.precio or 0),
                    "imagen": prod_obj.imagen
                }

        if not producto:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Producto no encontrado'}, status=404)
            messages.error(request, 'Producto no encontrado.')
            return redirect('productos')

        # Obtener carrito
        carrito = obtener_carrito(request)
        pid_key = str(producto.get('id', producto.get('_id')))

        # Incrementar cantidad
        carrito[pid_key] = carrito.get(pid_key, 0) + 1

        # Guardar en sesión / mongo
        guardar_carrito_helper(request, carrito)

        total_items = sum(carrito.values())

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': f'{producto.get("nombre")} agregado al carrito.',
                'total_items': total_items
            })

        messages.success(request, f'{producto.get("nombre")} agregado al carrito.')
        return redirect('carrito')

    return redirect('productos')


def carrito(request):
    carrito_data = obtener_carrito(request)
    productos_lista = []
    total = 0
    total_items = 0

    for pid, cantidad in carrito_data.items():
        try:
            if not pid or pid == "undefined":
                continue

            query = {"$or": []}
            try:
                query["$or"].append({"id": int(pid)})
            except ValueError:
                pass
            query["$or"].append({"id": str(pid)})

            if ObjectId.is_valid(pid):
                query["$or"].append({"_id": ObjectId(pid)})

            producto = settings.PRODUCTOS_COLLECTION.find_one(query)

            if not producto and pid.isdigit():
                prod_obj = Producto.objects.filter(id=int(pid)).first()
                if prod_obj:
                    producto = {
                        "_id": prod_obj.id,
                        "nombre": prod_obj.nombre,
                        "precio": float(prod_obj.precio or 0),
                        "imagen": prod_obj.imagen,
                        "descripcion": prod_obj.descripcion
                    }

            if producto:
                precio = float(producto.get("precio", 0))
                subtotal = precio * cantidad
                total += subtotal
                total_items += cantidad

                productos_lista.append({
                    "producto_id": str(producto.get("id", producto.get("_id"))),
                    "nombre": producto.get("nombre", "Producto"),
                    "precio": precio,
                    "imagen": producto.get("imagen", ""),
                    "descripcion": producto.get("descripcion", ""),
                    "cantidad": cantidad,
                    "subtotal": round(subtotal, 2),
                })
        except Exception as e:
            print(f"Error procesando producto {pid}: {e}")

    impuestos = total * 0.15
    total_con_impuestos = total + impuestos

    return render(
        request,
        "carrito.html",
        {
            "productos": productos_lista,
            "total": round(total, 2),
            "total_items": total_items,
            "impuestos": round(impuestos, 2),
            "total_con_impuestos": round(total_con_impuestos, 2),
        },
    )


def cambiar_cantidad(request, producto_id):
    if request.method == "POST":
        nueva_cantidad = int(request.POST.get("cantidad", 1))
        carrito = obtener_carrito(request)
        pid = str(producto_id)

        query = {"$or": []}
        try:
            query["$or"].append({"id": int(pid)})
        except ValueError:
            pass
        query["$or"].append({"id": str(pid)})

        if ObjectId.is_valid(pid):
            query["$or"].append({"_id": ObjectId(pid)})

        producto = settings.PRODUCTOS_COLLECTION.find_one(query)

        if not producto:
            return JsonResponse({"success": False, "message": "Producto no encontrado"})

        item_eliminado = False

        if nueva_cantidad <= 0:
            if pid in carrito:
                del carrito[pid]
                item_eliminado = True
                mensaje = f"{producto.get('nombre', 'Producto')} eliminado del carrito"
            else:
                return JsonResponse({"success": False, "message": "Producto no encontrado en carrito"})
        else:
            if nueva_cantidad > 99:
                nueva_cantidad = 99
            carrito[pid] = nueva_cantidad
            mensaje = f"Cantidad de {producto.get('nombre', 'Producto')} actualizada"

        guardar_carrito_helper(request, carrito)

        total_items = sum(carrito.values())
        subtotal_item = float(producto.get("precio", 0)) * nueva_cantidad if not item_eliminado else 0
        total_precio = sum(
            float(settings.PRODUCTOS_COLLECTION.find_one({"id": int(k)})['precio'] if k.isdigit() else 0) * v 
            for k, v in carrito.items()
        )

        return JsonResponse({
            "success": True,
            "message": mensaje,
            "data": {
                "item_eliminado": item_eliminado,
                "subtotal": round(subtotal_item, 2),
                "total": round(total_precio, 2),
                "total_items": total_items,
            },
        })

    return JsonResponse({"success": False, "message": "Método no permitido"})


def eliminar_carrito(request, producto_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Método no permitido"}, status=405)

    try:
        carrito = obtener_carrito(request)
        pid = str(producto_id)

        if pid not in carrito:
            return JsonResponse({"success": False, "message": "Producto no encontrado en carrito"}, status=404)

        del carrito[pid]
        guardar_carrito_helper(request, carrito)

        total_items = sum(carrito.values())

        return JsonResponse({
            "success": True,
            "message": "Producto eliminado del carrito",
            "data": {
                "total_items": total_items,
                "producto_id": pid,
            },
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Error: {str(e)}"}, status=500)


def vaciar_carrito(request):
    if request.method == "POST":
        if "gmail" in request.session:
            CarritoManager.vaciar_carrito_mongo(request.session["gmail"])

        CarritoManager.guardar_en_sesion(request, {})

        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse({"success": True, "message": "Carrito vaciado", "total_items": 0})

        return redirect("carrito")

    return JsonResponse({"success": False, "message": "Método no permitido"})


# ==================== LISTA DE DESEOS ====================


def obtener_lista_deseos(request):
    lista_sesion = request.session.get("lista-deseos", [])

    if "gmail" in request.session:
        lista_mongo = DeseosManager.obtener_de_mongo(request.session["gmail"])
        lista_completa = list(set(lista_sesion + lista_mongo))
        request.session["lista-deseos"] = lista_completa
        request.session.modified = True
        return lista_completa
    else:
        return lista_sesion


def guardar_lista_deseos(request, lista_deseos):
    lista_limpia = [str(item.get("producto_id")) if isinstance(item, dict) else str(item) for item in lista_deseos]
    request.session["lista-deseos"] = lista_limpia
    request.session.modified = True

    if "gmail" in request.session:
        DeseosManager.guardar_en_mongo(request.session["gmail"], lista_limpia)

    return True


def agregar_lista_deseo(request, producto_id):
    if request.method == "POST":
        lista_deseos = obtener_lista_deseos(request)
        pid = str(producto_id)

        query = {"$or": []}
        try:
            query["$or"].append({"id": int(pid)})
        except ValueError:
            pass
        query["$or"].append({"id": str(pid)})

        if ObjectId.is_valid(pid):
            query["$or"].append({"_id": ObjectId(pid)})

        producto = settings.PRODUCTOS_COLLECTION.find_one(query)

        if not producto:
            return JsonResponse({"success": False, "message": "Producto no encontrado"})

        if pid in lista_deseos:
            return JsonResponse({"success": False, "message": "Este producto ya está en tu lista de deseos"})

        lista_deseos.append(pid)
        guardar_lista_deseos(request, lista_deseos)

        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse({
                "success": True,
                "message": f"{producto.get('nombre', 'Producto')} agregado a tu lista de deseos",
                "total_deseos": len(lista_deseos),
            })

        return redirect("lista-deseos")

    return JsonResponse({"success": False, "message": "Método no permitido"})


def lista_deseos(request):
    try:
        lista_ids = obtener_lista_deseos(request)
        productos = []

        for pid in lista_ids:
            try:
                pid_str = str(pid).strip()
                if not pid_str or pid_str == "undefined":
                    continue

                query = {"$or": []}
                try:
                    query["$or"].append({"id": int(pid_str)})
                except ValueError:
                    pass
                query["$or"].append({"id": str(pid_str)})

                if ObjectId.is_valid(pid_str):
                    query["$or"].append({"_id": ObjectId(pid_str)})

                producto = settings.PRODUCTOS_COLLECTION.find_one(query)
                if producto:
                    productos.append({
                        "producto_id": str(producto.get("id", producto.get("_id"))),
                        "nombre": producto.get("nombre", "Producto"),
                        "descripcion": producto.get("descripcion", ""),
                        "precio": float(producto.get("precio", 0)),
                        "imagen": producto.get("imagen", ""),
                        "categoria": producto.get("categoria", "General"),
                        "disponible": producto.get("disponible", True),
                    })
            except Exception as e:
                print(f"Error cargando deseo {pid}: {e}")

        return render(request, "listaDeseo.html", {"lista": productos, "total_deseos": len(productos)})
    except Exception as e:
        traceback.print_exc()
        return render(request, "listaDeseo.html", {"lista": [], "total_deseos": 0})


def eliminar_lista_deseo(request, producto_id):
    if request.method == "POST":
        lista_deseos = obtener_lista_deseos(request)
        pid = str(producto_id)

        if pid in lista_deseos:
            lista_deseos.remove(pid)
            guardar_lista_deseos(request, lista_deseos)

            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return JsonResponse({
                    "success": True,
                    "message": "Eliminado de tu lista de deseos",
                    "total_deseos": len(lista_deseos),
                })

        return redirect("lista-deseos")

    return JsonResponse({"success": False, "message": "Método no permitido"})


def vaciar_lista(request):
    if request.method == "POST":
        if "gmail" in request.session:
            DeseosManager.vaciar_lista_mongo(request.session["gmail"])

        DeseosManager.guardar_en_sesion(request, {})

        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse({"success": True, "message": "Lista vaciada", "total_items": 0})

        return redirect("lista-deseos")

    return JsonResponse({"success": False, "message": "Método no permitido"})


def mover_al_carrito(request, producto_id):
    if request.method == "POST":
        lista_deseos = obtener_lista_deseos(request)
        pid = str(producto_id)

        if pid in lista_deseos:
            lista_deseos.remove(pid)
            guardar_lista_deseos(request, lista_deseos)

            carrito = obtener_carrito(request)
            carrito[pid] = carrito.get(pid, 0) + 1
            guardar_carrito_helper(request, carrito)

            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return JsonResponse({
                    "success": True,
                    "message": "Producto movido al carrito",
                    "data": {
                        "total_deseos": len(lista_deseos),
                        "total_carrito": sum(carrito.values()),
                    },
                })

        return redirect("lista-deseos")

    return JsonResponse({"success": False, "message": "Método no permitido"})


# ==================== CHECKOUT Y CITA ====================


def checkout(request):
    if requiere_login(request):
        return redirect("index")

    carrito_data = obtener_carrito(request)

    if not carrito_data:
        return redirect("carrito")

    productos_lista = []
    total = 0.0

    for pid, cantidad in carrito_data.items():
        if not pid or pid == "undefined":
            continue

        try:
            cant = int(cantidad)
        except (ValueError, TypeError):
            cant = 1

        # 1. Intentar buscar en MongoDB
        or_conditions = [{"id": str(pid)}, {"_id": str(pid)}]

        try:
            or_conditions.append({"id": int(pid)})
        except (ValueError, TypeError):
            pass

        if ObjectId.is_valid(pid):
            or_conditions.append({"_id": ObjectId(pid)})

        producto = settings.PRODUCTOS_COLLECTION.find_one({"$or": or_conditions})

        # 2. Si no está en MongoDB, buscar en SQLite (ORM Django)
        if not producto and str(pid).isdigit():
            prod_obj = Producto.objects.filter(id=int(pid)).first()
            if prod_obj:
                producto = {
                    "_id": str(prod_obj.id),
                    "nombre": prod_obj.nombre,
                    "precio": prod_obj.precio,
                }

        # 3. Procesar y parsear el precio de forma segura
        if producto:
            precio_raw = (
                producto.get("precio")
                or producto.get("price")
                or producto.get("costo")
                or 0
            )

            # Limpieza limpia de cadenas como "$150.00" o "150,00"
            try:
                precio_str = (
                    str(precio_raw)
                    .replace("$", "")
                    .replace(",", ".")
                    .strip()
                )
                precio = float(precio_str)
            except (ValueError, TypeError):
                precio = 0.0

            subtotal = precio * cant
            total += subtotal

            productos_lista.append(
                {
                    "producto_id": str(
                        producto.get("_id", producto.get("id"))
                    ),
                    "nombre": producto.get("nombre", "Producto"),
                    "precio": precio,
                    "cantidad": cant,
                    "subtotal": round(subtotal, 2),
                }
            )

    impuestos = total * 0.15
    total_con_impuestos = total + impuestos

    return render(
        request,
        "checkout.html",
        {
            "productos": productos_lista,
            "total": round(total, 2),
            "impuestos": round(impuestos, 2),
            "total_con_impuestos": round(total_con_impuestos, 2),
        },
    )


def procesar_compra(request):
    if requiere_login(request):
        return JsonResponse(
            {
                "success": False,
                "message": "Debes iniciar sesión para comprar",
                "require_login": True,
            }
        )

    if request.method != "POST":
        return JsonResponse(
            {"success": False, "message": "Método no permitido"}
        )

    try:
        gmail = request.session.get("gmail")
        carrito_data = obtener_carrito(request)

        if not carrito_data:
            return JsonResponse(
                {"success": False, "message": "El carrito está vacío"}
            )

        productos_lista = []
        total = 0.0

        for pid, cantidad in carrito_data.items():
            if not pid or pid == "undefined":
                continue

            try:
                cant = int(cantidad)
            except (ValueError, TypeError):
                cant = 1

            # Búsqueda en Mongo
            or_conditions = [{"id": str(pid)}, {"_id": str(pid)}]
            try:
                or_conditions.append({"id": int(pid)})
            except (ValueError, TypeError):
                pass

            if ObjectId.is_valid(pid):
                or_conditions.append({"_id": ObjectId(pid)})

            producto = settings.PRODUCTOS_COLLECTION.find_one(
                {"$or": or_conditions}
            )

            # Búsqueda alternativa en SQLite
            if not producto and str(pid).isdigit():
                prod_obj = Producto.objects.filter(id=int(pid)).first()
                if prod_obj:
                    producto = {
                        "_id": str(prod_obj.id),
                        "nombre": prod_obj.nombre,
                        "precio": prod_obj.precio,
                    }

            if producto:
                precio_raw = (
                    producto.get("precio")
                    or producto.get("price")
                    or producto.get("costo")
                    or 0
                )
                try:
                    precio_str = (
                        str(precio_raw)
                        .replace("$", "")
                        .replace(",", ".")
                        .strip()
                    )
                    precio = float(precio_str)
                except (ValueError, TypeError):
                    precio = 0.0

                subtotal = precio * cant
                total += subtotal

                productos_lista.append(
                    {
                        "producto_id": str(
                            producto.get("_id", producto.get("id"))
                        ),
                        "nombre": producto.get("nombre", "Producto"),
                        "precio": precio,
                        "cantidad": cant,
                        "subtotal": round(subtotal, 2),
                    }
                )

        impuestos = total * 0.15
        total_con_impuestos = total + impuestos

        orden = {
            "usuario_id": gmail,
            "productos": productos_lista,
            "subtotal": round(total, 2),
            "impuestos": round(impuestos, 2),
            "total": round(total_con_impuestos, 2),
            "estado": "completado",
            "fecha_creacion": datetime.now(),
            "metodo_pago": request.POST.get("metodo_pago", "tarjeta"),
            "datos_envio": {
                "nombre": request.POST.get("nombre"),
                "telefono": request.POST.get("telefono"),
                "direccion": request.POST.get("direccion"),
                "ciudad": request.POST.get("ciudad"),
                "codigo_postal": request.POST.get("codigo_postal"),
            },
        }

        db = settings.MONGO_COLLECTION.database
        resultado = db["ordenes"].insert_one(orden)

        CarritoManager.vaciar_carrito_mongo(gmail)
        CarritoManager.guardar_en_sesion(request, {})

        return JsonResponse(
            {
                "success": True,
                "message": "¡Compra realizada con éxito!",
                "orden_id": str(resultado.inserted_id),
                "redirect": f"/orden/{str(resultado.inserted_id)}/",
            }
        )

    except Exception as e:
        traceback.print_exc()
        return JsonResponse(
            {"success": False, "message": f"Error: {str(e)}"}, status=500
        )


def orden_detalle(request, orden_id):
    if requiere_login(request):
        return redirect("index")

    try:
        db = settings.MONGO_COLLECTION.database
        orden = db["ordenes"].find_one({"_id": ObjectId(orden_id)})

        if not orden:
            return render(request, "404.html", status=404)

        orden["id_str"] = str(orden["_id"])
        return render(request, "orden_detalle.html", {"orden": orden})
    except Exception:
        return render(request, "404.html", status=404)


def agendar_cita(request):
    return render(request, "agendar_cita.html")


def procesar_cita(request):
    if request.method == "POST":
        return JsonResponse({"success": True, "message": "Cita agendada correctamente"})
    return JsonResponse({"success": False, "message": "Método no permitido"})


def obtener_horarios_disponibles(request):
    horarios = ["09:00", "10:00", "11:00", "12:00", "16:00", "17:00"]
    return JsonResponse({"success": True, "horarios": horarios})

def acerca_de(request):
    return render(request, 'acerca.html')