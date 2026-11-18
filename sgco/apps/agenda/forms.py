from django import forms

from apps.cuentas.models import Odontologo
from apps.pacientes.models import Paciente

from .models import BloqueoAgenda, HorarioAtencion

DURACIONES = [(30, '30 minutos'), (60, '1 hora'), (90, '1 hora y media')]


class BuscarFranjaForm(forms.Form):
    """Primer paso de agendar: paciente, odontólogo, fecha, duración y motivo."""

    paciente = forms.ModelChoiceField(label='Paciente', queryset=Paciente.objects.all())
    odontologo = forms.ModelChoiceField(label='Odontólogo', queryset=Odontologo.objects.filter(is_active=True))
    fecha = forms.DateField(label='Fecha', widget=forms.DateInput(attrs={'type': 'date'}))
    duracion_min = forms.TypedChoiceField(label='Duración', choices=DURACIONES, coerce=int, initial=30)
    motivo = forms.CharField(label='Motivo', max_length=200)


class ReprogramarForm(forms.Form):
    fecha = forms.DateField(label='Nueva fecha', widget=forms.DateInput(attrs={'type': 'date'}))
    motivo = forms.CharField(label='Motivo del cambio', max_length=200)


class HorarioForm(forms.ModelForm):
    class Meta:
        model = HorarioAtencion
        fields = ['dia_semana', 'hora_inicio', 'hora_fin']
        widgets = {'hora_inicio': forms.TimeInput(attrs={'type': 'time'}), 'hora_fin': forms.TimeInput(attrs={'type': 'time'})}

    def clean(self):
        datos = super().clean()
        if datos.get('hora_inicio') and datos.get('hora_fin') and datos['hora_inicio'] >= datos['hora_fin']:
            raise forms.ValidationError('La hora de inicio debe ser anterior a la hora final.')
        return datos


class BloqueoForm(forms.ModelForm):
    class Meta:
        model = BloqueoAgenda
        fields = ['inicio', 'fin', 'motivo']
        widgets = {'inicio': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
                   'fin': forms.DateTimeInput(attrs={'type': 'datetime-local'})}

    def clean(self):
        datos = super().clean()
        if datos.get('inicio') and datos.get('fin') and datos['inicio'] >= datos['fin']:
            raise forms.ValidationError('El inicio del bloqueo debe ser anterior al final.')
        return datos
