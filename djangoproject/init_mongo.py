# init_mongo.py
from pymongo import MongoClient
from datetime import datetime


def inicializar_mongo():
    print("🚀 Inicializando MongoDB para carritos...")

    # Conexión a MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client["proyecto_python"]

    print("✅ Conectado a MongoDB")

    # Verificar si la colección ya existe
    colecciones = db.list_collection_names()

    if "carritos" in colecciones:
        print("⚠️ La colección 'carritos' ya existe")
        # Limpiar datos antiguos si quieres
        # db.carritos.drop()
        # print("🗑️ Colección 'carritos' eliminada y recreada")
    else:
        # Crear colección
        db.create_collection("carritos")
        print("✅ Colección 'carritos' creada")

    # Crear índice único para usuario_id
    db.carritos.create_index([("usuario_id", 1)], unique=True)
    print("✅ Índice único creado en campo 'usuario_id'")

    # Verificar que existe la colección de productos
    if "productos" not in colecciones:
        print("⚠️ ADVERTENCIA: La colección 'productos' no existe")
        print("   Ejecuta primero: python manage.py shell")
        print(
            "   Luego: from tienda.models import crear_productos_prueba; crear_productos_prueba()"
        )

    # Insertar datos de prueba (opcional - para probar)
    try:
        # Primero verificar si ya existe el usuario demo
        usuario_existe = db.usuarios.find_one({"gmail": "demo@demo.com"})

        if usuario_existe:
            # Insertar carrito de prueba
            resultado = db.carritos.update_one(
                {"usuario_id": "demo@demo.com"},
                {
                    "$set": {
                        "usuario_id": "demo@demo.com",
                        "items": [
                            {
                                "producto_id": "507f1f77bcf86cd799439011",  # ID de ejemplo
                                "cantidad": 2,
                                "precio_unitario": 99.99,
                                "agregado_en": datetime.now(),
                                "actualizado_en": datetime.now(),
                            }
                        ],
                        "total_items": 2,
                        "total_precio": 199.98,
                        "creado_en": datetime.now(),
                        "actualizado_en": datetime.now(),
                    }
                },
                upsert=True,  # Crea si no existe
            )

            if resultado.upserted_id:
                print("✅ Carrito de prueba creado para demo@demo.com")
            else:
                print("✅ Carrito de prueba actualizado para demo@demo.com")
        else:
            print("ℹ️ Usuario demo no encontrado. Creando usuario de prueba...")

            # Crear usuario demo
            db.usuarios.insert_one(
                {
                    "username": "UsuarioDemo",
                    "gmail": "demo@demo.com",
                    "password": "123456",
                    "fecha_registro": datetime.now(),
                    "activo": True,
                }
            )
            print("✅ Usuario demo creado: demo@demo.com / 123456")

            # Crear carrito para demo
            db.carritos.insert_one(
                {
                    "usuario_id": "demo@demo.com",
                    "items": [],
                    "total_items": 0,
                    "total_precio": 0,
                    "creado_en": datetime.now(),
                    "actualizado_en": datetime.now(),
                }
            )
            print("✅ Carrito vacío creado para demo")

    except Exception as e:
        print(f"⚠️ Error al crear datos de prueba: {e}")

    # Mostrar resumen
    print("\n📊 RESUMEN:")
    print(f"   Colecciones en la base de datos: {db.list_collection_names()}")
    print(f"   Documentos en 'carritos': {db.carritos.count_documents({})}")
    print(f"   Documentos en 'usuarios': {db.usuarios.count_documents({})}")
    print(f"   Documentos en 'productos': {db.productos.count_documents({})}")

    print("\n🎉 Inicialización completada!")
    print("   Puedes usar el usuario: demo@demo.com / 123456")


if __name__ == "__main__":
    inicializar_mongo()
