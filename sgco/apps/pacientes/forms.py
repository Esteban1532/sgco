from django import forms

from .models import Paciente


class PacienteForm(forms.ModelForm):
    class Meta:
        model = Paciente
        fields = ['documento', 'nombres', 'apellidos', 'fecha_nacimiento', 'telefono', 'correo',
                  'acepta_mensajes', 'autoriza_datos']
        widgets = {'fecha_nacimiento': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d')}

    def clean_autoriza_datos(self):
        if not self.cleaned_data['autoriza_datos']:
            raise forms.ValidationError('Sin la autorización de tratamiento de datos no se puede registrar al paciente.')
        return True
