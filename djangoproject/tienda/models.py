from django.db import models

# Create your models here.

class Project(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    imagen = models.CharField(max_length=255, default="img/default.png")
    categoria = models.CharField(max_length=100, default="Abarrotes y Despensa")
    stock = models.IntegerField(default=10)
    es_limitado = models.BooleanField(default=False)

    class Meta:
        db_table = 'tienda_producto'  # Conecta directamente con la colección de MongoDB

    def __str__(self):
        return self.nombre