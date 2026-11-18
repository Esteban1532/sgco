from django import forms

from .models import ItemTratamiento, MedioPago, PlanTratamiento

ItemFormSet = forms.inlineformset_factory(
    PlanTratamiento, ItemTratamiento, fields=['procedimiento', 'pieza', 'valor'],
    extra=4, can_delete=False, min_num=1, validate_min=True,
)


class PlanForm(forms.ModelForm):
    class Meta:
        model = PlanTratamiento
        fields = ['descripcion']


class PagoForm(forms.Form):
    valor = forms.DecimalField(label='Valor', max_digits=12, decimal_places=0, min_value=1)
    medio_pago = forms.ChoiceField(label='Medio de pago', choices=MedioPago.choices)
