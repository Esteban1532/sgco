from django import forms
from django.contrib.auth.password_validation import validate_password

from .models import Odontologo, Rol, Usuario


class UsuarioNuevoForm(forms.Form):
    username = forms.CharField(label='Usuario', max_length=150)
    first_name = forms.CharField(label='Nombres', max_length=80)
    last_name = forms.CharField(label='Apellidos', max_length=80)
    documento = forms.CharField(label='Documento', max_length=20)
    email = forms.EmailField(label='Correo', required=False)
    telefono = forms.CharField(label='Teléfono', max_length=20, required=False)
    rol = forms.ChoiceField(label='Rol', choices=Rol.choices)
    registro_profesional = forms.CharField(label='Registro profesional (solo odontólogos)', max_length=30, required=False)
    especialidad = forms.CharField(label='Especialidad (solo odontólogos)', max_length=60, required=False)
    password1 = forms.CharField(label='Contraseña', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Repita la contraseña', widget=forms.PasswordInput)

    def clean_username(self):
        username = self.cleaned_data['username']
        if Usuario.objects.filter(username=username).exists():
            raise forms.ValidationError('Ya existe un usuario con ese nombre.')
        return username

    def clean_documento(self):
        documento = self.cleaned_data['documento']
        if Usuario.objects.filter(documento=documento).exists():
            raise forms.ValidationError('Ya existe un usuario con ese documento.')
        return documento

    def clean(self):
        datos = super().clean()
        if datos.get('password1') != datos.get('password2'):
            self.add_error('password2', 'Las contraseñas no coinciden.')
        elif datos.get('password1'):
            try:
                validate_password(datos['password1'])
            except forms.ValidationError as error:
                self.add_error('password1', error)
        if datos.get('rol') == Rol.ODONTOLOGO and not datos.get('registro_profesional'):
            self.add_error('registro_profesional', 'El registro profesional es obligatorio para odontólogos.')
        return datos

    def save(self):
        d = self.cleaned_data
        campos = dict(username=d['username'], first_name=d['first_name'], last_name=d['last_name'],
                      documento=d['documento'], email=d['email'], telefono=d['telefono'], rol=d['rol'])
        if d['rol'] == Rol.ODONTOLOGO:
            usuario = Odontologo(**campos, registro_profesional=d['registro_profesional'],
                                 especialidad=d['especialidad'] or 'General')
        else:
            usuario = Usuario(**campos)
        usuario.set_password(d['password1'])
        usuario.save()
        return usuario


class UsuarioEdicionForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = ['first_name', 'last_name', 'email', 'telefono']
        labels = {'first_name': 'Nombres', 'last_name': 'Apellidos', 'email': 'Correo'}
