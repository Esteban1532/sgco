from django import forms

from .models import Evolucion, HistoriaClinica


class HistoriaForm(forms.ModelForm):
    class Meta:
        model = HistoriaClinica
        fields = ['motivo_consulta', 'antecedentes', 'alergias', 'medicamentos', 'examen_inicial']
        widgets = {f: forms.Textarea(attrs={'rows': 3}) for f in ['motivo_consulta', 'antecedentes', 'examen_inicial']}


class EvolucionForm(forms.ModelForm):
    class Meta:
        model = Evolucion
        fields = ['cita', 'procedimiento', 'descripcion']
        widgets = {'descripcion': forms.Textarea(attrs={'rows': 3})}

    def __init__(self, *args, paciente=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cita'].required = False
        self.fields['cita'].label = 'Cita atendida (opcional)'
        self.fields['cita'].queryset = paciente.citas.order_by('-fecha') if paciente else self.fields['cita'].queryset.none()
