# tienda/carrito_manager.py - NUEVO ARCHIVO
from datetime import datetime
from bson import ObjectId
from django.conf import settings


class CarritoManager:
    """Gestor profesional de carritos (Sesión + MongoDB)"""

    @staticmethod
    def obtener_de_sesion(request):
        """Obtiene carrito de la sesión Django"""
        if "carrito" not in request.session:
            request.session["carrito"] = {}
        return request.session["carrito"]

    @staticmethod
    def guardar_en_sesion(request, carrito):
        """Guarda carrito en sesión Django"""
        request.session["carrito"] = carrito
        request.session.modified = True

    @staticmethod
    def obtener_de_mongo(gmail):
        """Obtiene carrito desde MongoDB para un usuario"""
        if not gmail:
            return {}

        carrito_db = settings.CARRITOS_COLLECTION.find_one({"usuario_id": gmail})
        if carrito_db:
            # Convertir formato MongoDB a diccionario simple
            carrito_dict = {}
            for item in carrito_db.get("items", []):
                pid = str(item["producto_id"])
                carrito_dict[pid] = item["cantidad"]
            return carrito_dict
        return {}

    @staticmethod
    def guardar_en_mongo(gmail, carrito):
        """Guarda carrito en MongoDB"""
        if not gmail:
            return False

        # Preparar items para MongoDB
        items_mongo = []
        for pid, cantidad in carrito.items():
            items_mongo.append(
                {
                    "producto_id": pid,
                    "cantidad": int(cantidad),
                    "precio_unitario": CarritoManager._obtener_precio_producto(pid),
                    "agregado_en": datetime.now(),
                    "actualizado_en": datetime.now(),
                }
            )

        # Calcular totales
        total_items = sum(carrito.values())
        total_precio = CarritoManager._calcular_total(carrito)

        # Guardar/Actualizar en MongoDB
        settings.CARRITOS_COLLECTION.update_one(
            {"usuario_id": gmail},
            {
                "$set": {
                    "usuario_id": gmail,
                    "items": items_mongo,
                    "total_items": total_items,
                    "total_precio": total_precio,
                    "actualizado_en": datetime.now(),
                    "creado_en": datetime.now(),
                }
            },
            upsert=True,  # Crea si no existe
        )
        return True

    @staticmethod
    def fusionar_carritos(carrito_sesion, carrito_mongo):
        """
        Fusiona dos carritos:
        - Si mismo producto en ambos, suma cantidades
        - Mantiene máximo de 99 por producto
        """
        carrito_fusionado = carrito_mongo.copy()

        for pid, cantidad_sesion in carrito_sesion.items():
            if pid in carrito_fusionado:
                nueva_cantidad = carrito_fusionado[pid] + cantidad_sesion
                carrito_fusionado[pid] = min(nueva_cantidad, 99)  # Máximo 99
            else:
                carrito_fusionado[pid] = min(cantidad_sesion, 99)

        return carrito_fusionado

    @staticmethod
    def migrar_sesion_a_mongo(request):
        """
        Migra carrito de sesión a MongoDB cuando usuario se loguea
        Retorna True si se migró algo
        """
        gmail = request.session.get("gmail")
        if not gmail:
            return False

        carrito_sesion = CarritoManager.obtener_de_sesion(request)
        if not carrito_sesion:
            return False

        # Obtener carrito existente en MongoDB
        carrito_mongo = CarritoManager.obtener_de_mongo(gmail)

        # Fusionar carritos
        carrito_fusionado = CarritoManager.fusionar_carritos(
            carrito_sesion, carrito_mongo
        )

        # Guardar en MongoDB
        CarritoManager.guardar_en_mongo(gmail, carrito_fusionado)

        # Actualizar sesión con carrito fusionado
        CarritoManager.guardar_en_sesion(request, carrito_fusionado)

        return True

    @staticmethod
    def _obtener_precio_producto(producto_id):
        """Obtiene precio de producto desde MongoDB"""
        try:
            producto = settings.PRODUCTOS_COLLECTION.find_one(
                {"_id": ObjectId(producto_id)}
            )
            return float(producto.get("precio", 0)) if producto else 0
        except:
            return 0

    @staticmethod
    def _calcular_total(carrito):
        """Calcula total del carrito"""
        total = 0
        for pid, cantidad in carrito.items():
            precio = CarritoManager._obtener_precio_producto(pid)
            total += precio * cantidad
        return round(total, 2)

    @staticmethod
    def vaciar_carrito_mongo(gmail):
        """Vacía carrito en MongoDB"""
        if gmail:
            settings.CARRITOS_COLLECTION.delete_one({"usuario_id": gmail})
        return True
