from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

# Este es tu formulario de tareas original (se queda intacto)
class CreateNewTask(forms.Form):
    title = forms.CharField(label="Titulo de tarea", max_length=200)
    description = forms.CharField(label="Descripcion de la tarea", widget=forms.Textarea)

# Este es el nuevo formulario para registrar usuarios que agregamos al final
class RegistroUsuarioForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email']