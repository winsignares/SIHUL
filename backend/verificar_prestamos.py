from prestamos.models import PrestamoEspacio, TipoActividad, PrestamoRecurso

print('='*70)
print('📊 RESUMEN DE PRÉSTAMOS')
print('='*70)

print('\n📌 Préstamos por estado:')
for estado in ['Aprobado', 'Pendiente', 'Rechazado', 'Vencido']:
    count = PrestamoEspacio.objects.filter(estado=estado).count()
    print(f'  {estado}: {count}')

print(f'\n📋 Tipos de actividad: {TipoActividad.objects.count()}')
print(f'🔧 Recursos en préstamos: {PrestamoRecurso.objects.count()}')
print(f'📦 Total préstamos: {PrestamoEspacio.objects.count()}')

print('\n📅 Últimos 10 préstamos creados:')
for p in PrestamoEspacio.objects.order_by('-id')[:10]:
    recursos = [f"{pr.recurso.nombre}({pr.cantidad})" for pr in p.prestamo_recursos.all()[:3]]
    recursos_str = ', '.join(recursos) if recursos else 'Sin recursos'
    
    print(f'\n  [{p.estado}] ID: {p.id}')
    print(f'  📅 {p.fecha} ⏰ {p.hora_inicio}-{p.hora_fin}')
    print(f'  🏢 {p.espacio.nombre} - {p.tipo_actividad.nombre}')
    print(f'  👤 Solicitante: {p.usuario.nombre if p.usuario else "N/A"}')
    print(f'  🔧 Recursos: {recursos_str}')

print('\n' + '='*70)
