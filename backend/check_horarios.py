from horario.models import Horario
from django.db.models import Count

print("\n📊 Horarios por Docente:\n")
stats = Horario.objects.select_related('docente').values('docente__nombre').annotate(total=Count('id')).order_by('-total')
for stat in stats:
    print(f"  {stat['docente__nombre']}: {stat['total']} horarios")

print(f"\n📈 Total: {Horario.objects.count()} horarios")

print("\n📋 Resumen de Grupos y sus Horarios:\n")
grupos_stats = Horario.objects.select_related('grupo').values('grupo__nombre').annotate(total=Count('id')).order_by('grupo__nombre')
for stat in grupos_stats:
    print(f"  {stat['grupo__nombre']}: {stat['total']} horarios")
