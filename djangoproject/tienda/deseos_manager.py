# tienda/deseos_manager.py
from datetime import datetime
from bson import ObjectId
from django.conf import settings


class DeseosManager:
    """Gestor profesional de lista de deseos (Sesión + MongoDB)"""

    @staticmethod
    def obtener_de_sesion(request):
        """Obtiene lista de deseos de la sesión Django"""
        # Usar 'lista-deseos' con guion consistentemente
        if "lista-deseos" not in request.session:
            request.session["lista-deseos"] = []
        return request.session["lista-deseos"]

    @staticmethod
    def guardar_en_sesion(request, lista_deseos):
        """Guarda lista de deseos en sesión Django"""
        lista_limpia = []
        for item in lista_deseos:
            if isinstance(item, dict):
                if "producto_id" in item:
                    lista_limpia.append(str(item["producto_id"]))
            else:
                lista_limpia.append(str(item))

        # Siempre usar 'lista-deseos'
        request.session["lista-deseos"] = lista_limpia
        request.session.modified = True

    @staticmethod
    def obtener_de_mongo(gmail):
        """Obtiene lista de deseos desde MongoDB para un usuario"""
        if not gmail:
            return []

        lista_db = settings.LISTA_DESEOS_COLLECTION.find_one({"usuario_id": gmail})
        print(f"DEBUG obtener_de_mongo: Documento encontrado: {lista_db}")

        if lista_db:
            # Obtener la lista de productos
            productos = lista_db.get("productos", [])
            print(f"DEBUG obtener_de_mongo: Productos: {productos}")

            # Extraer solo los IDs
            lista_ids = []
            for producto in productos:
                if isinstance(producto, dict):
                    pid = producto.get("producto_id")
                    if pid:
                        lista_ids.append(str(pid))
                else:
                    lista_ids.append(str(producto))

            print(f"DEBUG obtener_de_mongo: IDs extraídos: {lista_ids}")
            return lista_ids
        return []

    @staticmethod
    def guardar_en_mongo(gmail, lista_deseos):
        """Guarda lista de deseos en MongoDB"""
        if not gmail:
            return False

        # Preparar datos para MongoDB
        productos_mongo = []
        for pid in lista_deseos:
            productos_mongo.append(
                {
                    "producto_id": pid,
                    "agregado_en": datetime.now(),
                    "precio_actual": DeseosManager._obtener_precio_producto(pid),
                }
            )

        # Guardar/Actualizar en MongoDB
        settings.LISTA_DESEOS_COLLECTION.update_one(
            {"usuario_id": gmail},
            {
                "$set": {
                    "usuario_id": gmail,
                    "productos": productos_mongo,
                    "total_productos": len(lista_deseos),
                    "actualizado_en": datetime.now(),
                    "creado_en": (
                        datetime.now()
                        if not settings.LISTA_DESEOS_COLLECTION.find_one(
                            {"usuario_id": gmail}
                        )
                        else None
                    ),
                }
            },
            upsert=True,  # Crea si no existe
        )
        return True

    @staticmethod
    def fusionar_listas(lista_sesion, lista_mongo):
        """
        Fusiona dos listas de deseos:
        - Si mismo producto en ambas, queda solo una vez
        - Elimina duplicados
        """
        # Convertir a set para eliminar duplicados, luego a lista
        lista_fusionada = list(set(lista_sesion + lista_mongo))
        return lista_fusionada

    @staticmethod
    def migrar_sesion_a_mongo(request):
        """
        Migra lista de deseos de sesión a MongoDB cuando usuario se loguea
        """
        gmail = request.session.get("gmail")
        if not gmail:
            return False

        lista_sesion = DeseosManager.obtener_de_sesion(request)
        if not lista_sesion:
            return False

        # Obtener lista existente en MongoDB
        lista_mongo = DeseosManager.obtener_de_mongo(gmail)

        # Fusionar listas
        lista_fusionada = DeseosManager.fusionar_listas(lista_sesion, lista_mongo)

        # Guardar en MongoDB
        DeseosManager.guardar_en_mongo(gmail, lista_fusionada)

        # Actualizar sesión con lista fusionada
        DeseosManager.guardar_en_sesion(request, lista_fusionada)

        return True

    @staticmethod
    def eliminar_de_mongo(gmail, producto_id):
        """Elimina producto de lista de deseos en MongoDB"""
        if not gmail:
            return False

        settings.LISTA_DESEOS_COLLECTION.update_one(
            {"usuario_id": gmail},
            {"$pull": {"productos": {"producto_id": producto_id}}},
        )
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
    def vaciar_lista_mongo(gmail):
        """Vacía carrito en MongoDB"""
        if gmail:
            settings.LISTA_DESEOS_COLLECTION.delete_one({"usuario_id": gmail})
        return True
