# 💰 GUÍA DE INTEGRACIÓN - MÓDULO FINANCIERO A SIHUL

**Enfoque**: Integración del módulo Sihul-Financiera dentro de SIHUL principal

---

## 📋 RESUMEN ESTRATÉGICO

El módulo Financiero debe seguir la **arquitectura dinámica de componentes** de SIHUL:

1. ✅ **No crear un app separado**: Integrar como un módulo dentro de SIHUL
2. ✅ **Usar el sistema de Componentes**: "Gestión Financiera", "Reportes Financieros", etc.
3. ✅ **Compartir AuthContext**: El financiero hereda la autenticación
4. ✅ **Respetar roles**: admin, jefe_financiero, contador, auditor, etc.
5. ✅ **Sincronizar permisos**: Los cambios en BD se ven en ~7 segundos

---

## 🎯 DECISIONES CLAVE

### Opción A: Módulo Separado con Routing (NO RECOMENDADO)
- Versionable independiente
- Pero: Requiere duplicar AuthContext, necesita sincronización manual, difícil hacer auditaje integrado

### Opción B: Módulo Integrado en SIHUL (✅ RECOMENDADO)
- Usa misma DB, autenticación, sistema de menú
- Ventajas:
  - ✅ Reportes financieros + académicos juntos
  - ✅ Un solo login
  - ✅ Auditaje centralizado (quién hizo qué transacción)
  - ✅ Permisos finogranulares por facultad/sede
  - ✅ Tableros integrados

**Recomendación: Opción B**

---

## 📁 ESTRUCTURA PROPUESTA

```
backend/
├── financiero/                    ← NUEVO APP
│   ├── admin.py                   ← Registrar en admin Django
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py                   ← ViewSets REST
│   ├── permissions.py             ← Permisos personalizados
│   ├── api_urls.py                ← /api/financiero/*
│   ├── urls.py
│   ├── tests.py
│   ├── management/
│   │   └── commands/
│   │       └── crear_roles_financiero.py  ← Script para agregar roles
│   └── migrations/
│
├── auditoria/                     ← Si necesitas auditar cambios
│   ├── models.py
│   └── ...

frontend/
├── src/
│   ├── pages/
│   │   ├── financiero/            ← NUEVO (si separa)
│   │   │   ├── GestionFinanciera.tsx
│   │   │   ├── ReportesFinancieros.tsx
│   │   │   └── components/
│   │   └── (O integrar en gestionAcademica/)
│   │
│   ├── services/api/
│   │   ├── financiero.ts          ← Cliente API
│   │   └── ...
│   │
│   ├── config/
│   │   └── componentRoutes.ts     ← Actualizar

Sihul-Financiera/                  ← LEGACY (importar código)
├── src/
│   ├── components/admin/
│   └── ...
```

---

## 🔧 INTEGRACIÓN PASO A PASO

### FASE 1: Backend - Setup Django

#### 1.1 Crear App

```bash
cd backend
python manage.py startapp financiero
```

#### 1.2 Modelos (financiero/models.py)

```python
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from usuarios.models import Usuario, Rol
from facultades.models import Facultad
from periodos.models import Periodo

class CentroFinanciero(models.Model):
    """Centro/Dependencia financiera (Rectoría, Facultades, etc)"""
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True)
    facultad = models.ForeignKey(
        Facultad, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='centros_financieros'
    )
    responsable = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='centros_financieros_responsable'
    )
    presupuesto_anual = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['nombre']
        verbose_name_plural = "Centros Financieros"
    
    def __str__(self):
        return self.nombre

class Presupuesto(models.Model):
    """Presupuesto para un período académico"""
    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        APROBADO = 'APROBADO', 'Aprobado'
        EJECUTANDO = 'EJECUTANDO', 'En ejecución'
        CERRADO = 'CERRADO', 'Cerrado'
    
    id = models.AutoField(primary_key=True)
    centro = models.ForeignKey(
        CentroFinanciero,
        on_delete=models.CASCADE,
        related_name='presupuestos'
    )
    periodo = models.ForeignKey(
        Periodo,
        on_delete=models.CASCADE,
        related_name='presupuestos'
    )
    monto_total = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.BORRADOR)
    
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='presupuestos_creados'
    )
    aprobado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='presupuestos_aprobados'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    
    observaciones = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ('centro', 'periodo')
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.centro.nombre} - {self.periodo} - {self.get_estado_display()}"
    
    @property
    def monto_ejecutado(self):
        return self.transacciones.filter(tipo='EGRESO').aggregate(
            total=models.Sum('monto')
        )['total'] or 0
    
    @property
    def monto_disponible(self):
        return self.monto_total - self.monto_ejecutado

class Transaccion(models.Model):
    """Ingreso o egreso financiero"""
    class Tipo(models.TextChoices):
        INGRESO = 'INGRESO', 'Ingreso'
        EGRESO = 'EGRESO', 'Egreso'
    
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        APROBADA = 'APROBADA', 'Aprobada'
        RECHAZADA = 'RECHAZADA', 'Rechazada'
        EJECUTADA = 'EJECUTADA', 'Ejecutada'
    
    id = models.AutoField(primary_key=True)
    presupuesto = models.ForeignKey(
        Presupuesto,
        on_delete=models.CASCADE,
        related_name='transacciones'
    )
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.EGRESO
    )
    monto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    descripcion = models.TextField()
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )
    categoria = models.CharField(
        max_length=100,
        help_text="Ej: Servicios, Equipos, Viáticos"
    )
    
    solicitante = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transacciones_solicitadas'
    )
    aprobado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transacciones_aprobadas'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_ejecucion = models.DateTimeField(null=True, blank=True)
    
    comprobante = models.FileField(
        upload_to='comprobantes/',
        null=True,
        blank=True,
        help_text="Factura, recibo, etc"
    )
    
    class Meta:
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['presupuesto', 'tipo']),
            models.Index(fields=['estado']),
            models.Index(fields=['solicitante'])
        ]
    
    def __str__(self):
        return f"{self.get_tipo_display()} ${self.monto} - {self.descripcion[:50]}"

class ReporteFinanciero(models.Model):
    """Reporte generado para análisis"""
    class Tipo(models.TextChoices):
        EJECUCION = 'EJECUCION', 'Ejecución Presupuestaria'
        INGRESOS = 'INGRESOS', 'Ingresos'
        EGRESOS = 'EGRESOS', 'Egresos'
        COMPARATIVO = 'COMPARATIVO', 'Comparativo'
    
    id = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    centro = models.ForeignKey(
        CentroFinanciero,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    periodo = models.ForeignKey(Periodo, on_delete=models.CASCADE)
    
    generado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reportes_financieros_generados'
    )
    
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    datos = models.JSONField(default=dict)  # Datos del reporte
    archivo_pdf = models.FileField(upload_to='reportes/', null=True, blank=True)
    archivo_excel = models.FileField(upload_to='reportes/', null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_generacion']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.periodo}"

class AuditoriaFinanciera(models.Model):
    """Log de cambios en transacciones (para auditoría)"""
    id = models.AutoField(primary_key=True)
    transaccion = models.ForeignKey(
        Transaccion,
        on_delete=models.CASCADE,
        related_name='auditorias'
    )
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(
        max_length=50,
        help_text="crear, actualizar, aprobar, rechazar, ejecutar"
    )
    cambios = models.JSONField(
        default=dict,
        help_text="Campo antiguo -> nuevo"
    )
    fecha = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha']
        verbose_name_plural = "Auditorías Financieras"
    
    def __str__(self):
        return f"{self.accion} de {self.transaccion} por {self.usuario}"
```

#### 1.3 Serializers (financiero/serializers.py)

```python
from rest_framework import serializers
from .models import CentroFinanciero, Presupuesto, Transaccion, ReporteFinanciero

class CentroFinancieroSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre', read_only=True)
    
    class Meta:
        model = CentroFinanciero
        fields = [
            'id', 'nombre', 'facultad', 'facultad_nombre',
            'responsable', 'responsable_nombre', 'presupuesto_anual',
            'activo', 'fecha_creacion'
        ]

class PresupuestoSerializer(serializers.ModelSerializer):
    centro_nombre = serializers.CharField(source='centro.nombre', read_only=True)
    periodo_nombre = serializers.SerializerMethodField()
    creado_por_nombre = serializers.CharField(source='creado_por.nombre', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.nombre', read_only=True)
    monto_ejecutado = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    monto_disponible = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    
    def get_periodo_nombre(self, obj):
        return f"{obj.periodo.nombre}" if obj.periodo else None
    
    class Meta:
        model = Presupuesto
        fields = [
            'id', 'centro', 'centro_nombre', 'periodo', 'periodo_nombre',
            'monto_total', 'monto_ejecutado', 'monto_disponible',
            'estado', 'creado_por', 'creado_por_nombre',
            'aprobado_por', 'aprobado_por_nombre',
            'fecha_creacion', 'fecha_aprobacion', 'observaciones'
        ]

class TransaccionSerializer(serializers.ModelSerializer):
    presupuesto_centro = serializers.CharField(source='presupuesto.centro.nombre', read_only=True)
    solicitante_nombre = serializers.CharField(source='solicitante.nombre', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.nombre', read_only=True)
    
    class Meta:
        model = Transaccion
        fields = [
            'id', 'presupuesto', 'presupuesto_centro', 'tipo', 'monto',
            'descripcion', 'estado', 'categoria',
            'solicitante', 'solicitante_nombre',
            'aprobado_por', 'aprobado_por_nombre',
            'fecha_creacion', 'fecha_aprobacion', 'fecha_ejecucion',
            'comprobante'
        ]
```

#### 1.4 Views (financiero/views.py)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    CentroFinanciero, Presupuesto, Transaccion, ReporteFinanciero
)
from .serializers import (
    CentroFinancieroSerializer, PresupuestoSerializer,
    TransaccionSerializer
)

class CentroFinancieroViewSet(viewsets.ModelViewSet):
    queryset = CentroFinanciero.objects.select_related('facultad', 'responsable')
    serializer_class = CentroFinancieroSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filtrar por facultad del usuario si es planeación facultad
        user = self.request.user
        if hasattr(user, 'facultad') and user.facultad:
            if user.rol and 'planeacion' in user.rol.nombre.lower():
                return super().get_queryset().filter(facultad=user.facultad)
        return super().get_queryset()

class PresupuestoViewSet(viewsets.ModelViewSet):
    queryset = Presupuesto.objects.select_related(
        'centro', 'periodo', 'creado_por', 'aprobado_por'
    )
    serializer_class = PresupuestoSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        presupuesto = self.get_object()
        if presupuesto.estado != Presupuesto.Estado.BORRADOR:
            return Response(
                {'error': 'Solo se pueden aprobar presupuestos en borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        presupuesto.estado = Presupuesto.Estado.APROBADO
        presupuesto.aprobado_por = request.user
        presupuesto.fecha_aprobacion = timezone.now()
        presupuesto.save()
        
        return Response(
            PresupuestoSerializer(presupuesto).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def por_centro(self, request):
        centro_id = request.query_params.get('centro_id')
        if centro_id:
            presupuestos = self.get_queryset().filter(centro_id=centro_id)
            serializer = self.get_serializer(presupuestos, many=True)
            return Response(serializer.data)
        return Response({'error': 'centro_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

class TransaccionViewSet(viewsets.ModelViewSet):
    queryset = Transaccion.objects.select_related(
        'presupuesto', 'solicitante', 'aprobado_por'
    )
    serializer_class = TransaccionSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        transaccion = self.get_object()
        if transaccion.estado != Transaccion.Estado.PENDIENTE:
            return Response(
                {'error': 'Solo se pueden aprobar transacciones pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaccion.estado = Transaccion.Estado.APROBADA
        transaccion.aprobado_por = request.user
        transaccion.fecha_aprobacion = timezone.now()
        transaccion.save()
        
        return Response(
            TransaccionSerializer(transaccion).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        # Implementar rechazo
        pass
```

#### 1.5 URLs (financiero/api_urls.py)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'centros', views.CentroFinancieroViewSet, basename='centro-financiero')
router.register(r'presupuestos', views.PresupuestoViewSet, basename='presupuesto')
router.register(r'transacciones', views.TransaccionViewSet, basename='transaccion')

urlpatterns = [
    path('', include(router.urls)),
]

# En mysite/urls.py agregar:
# path('api/financiero/', include('financiero.api_urls')),
```

#### 1.6 Registrar en apps (mysite/settings.py)

```python
INSTALLED_APPS = [
    # ... existentes ...
    'financiero',
]
```

#### 1.7 Migrations

```bash
python manage.py makemigrations financiero
python manage.py migrate
```

---

### FASE 2: Backend - Crear Roles y Componentes

#### 2.1 Script (financiero/management/commands/crear_roles_financiero.py)

```python
from django.core.management.base import BaseCommand
from usuarios.models import Rol
from componentes.models import Componente, ComponenteRol

class Command(BaseCommand):
    help = 'Crea roles y componentes para el módulo financiero'
    
    def handle(self, *args, **options):
        # Crear roles
        jefe_financiero, _ = Rol.objects.get_or_create(
            nombre='jefe_financiero',
            defaults={'descripcion': 'Jefe de Finanzas'}
        )
        
        contador, _ = Rol.objects.get_or_create(
            nombre='contador',
            defaults={'descripcion': 'Contador/Contable'}
        )
        
        auditor, _ = Rol.objects.get_or_create(
            nombre='auditor',
            defaults={'descripcion': 'Auditor Interno'}
        )
        
        # Crear componentes
        comp_gestion, _ = Componente.objects.get_or_create(
            nombre='Gestión Financiera',
            defaults={'descripcion': 'CRUD presupuestos y transacciones'}
        )
        
        comp_reportes, _ = Componente.objects.get_or_create(
            nombre='Reportes Financieros',
            defaults={'descripcion': 'Visualización de reportes financieros'}
        )
        
        comp_auditoria, _ = Componente.objects.get_or_create(
            nombre='Auditoría Financiera',
            defaults={'descripcion': 'Log y auditoría de cambios'}
        )
        
        # Asignar permisos
        ComponenteRol.objects.get_or_create(
            rol=jefe_financiero,
            componente=comp_gestion,
            defaults={'permiso': 'EDITAR'}
        )
        ComponenteRol.objects.get_or_create(
            rol=jefe_financiero,
            componente=comp_reportes,
            defaults={'permiso': 'EDITAR'}
        )
        
        ComponenteRol.objects.get_or_create(
            rol=contador,
            componente=comp_gestion,
            defaults={'permiso': 'EDITAR'}
        )
        ComponenteRol.objects.get_or_create(
            rol=contador,
            componente=comp_reportes,
            defaults={'permiso': 'VER'}
        )
        
        ComponenteRol.objects.get_or_create(
            rol=auditor,
            componente=comp_auditoria,
            defaults={'permiso': 'VER'}
        )
        
        self.stdout.write(self.style.SUCCESS('Roles y componentes creados'))
```

#### 2.2 Ejecutar script

```bash
python manage.py crear_roles_financiero
```

---

### FASE 3: Frontend - Agregar Componentes

#### 3.1 Actualizar componentRoutes.ts

```typescript
// src/config/componentRoutes.ts
import { DollarSign, BarChart3, Shield } from 'lucide-react';

export const COMPONENT_ROUTES: Record<string, string> = {
    // ... existentes ...
    'Gestión Financiera': '/admin/financiero',
    'Reportes Financieros': '/admin/reportes-financieros',
    'Auditoría Financiera': '/admin/auditoria-financiera'
};

export const COMPONENT_ICONS: Record<string, LucideIcon> = {
    // ... existentes ...
    'Gestión Financiera': DollarSign,
    'Reportes Financieros': BarChart3,
    'Auditoría Financiera': Shield
};
```

#### 3.2 Actualizar useAdminDashboard.ts

```typescript
// Agregar sección financiera
const financeNames = [
    'Gestión Financiera',
    'Reportes Financieros',
    'Auditoría Financiera'
];

const financeComponents = financeNames
    .map(name => components.find(c => c.nombre === name))
    .filter((c): c is typeof components[0] => c !== undefined);

if (financeComponents.length > 0) {
    sections.push({
        id: 'financiero',
        label: 'Financiero',
        items: financeComponents.map(c => ({
            id: c.nombre,
            icon: getIconForComponent(c.nombre),
            label: cleanLabel(c.nombre),
            route: getRouteForComponent(c.nombre),
            code: c.nombre
        }))
    });
}

// Insertar en orden correcto (después de Gestión Académica, antes de Reportes)
```

#### 3.3 Crear Servicio API

```typescript
// src/services/api/financiero.ts
import { apiClient } from '../../core/apiClient';

export interface CentroFinanciero {
    id: number;
    nombre: string;
    facultad_id?: number;
    facultad_nombre?: string;
    responsable_id?: number;
    responsable_nombre?: string;
    presupuesto_anual: number;
    activo: boolean;
}

export interface Presupuesto {
    id: number;
    centro_id: number;
    centro_nombre: string;
    periodo_id: number;
    periodo_nombre: string;
    monto_total: number;
    monto_ejecutado: number;
    monto_disponible: number;
    estado: 'BORRADOR' | 'APROBADO' | 'EJECUTANDO' | 'CERRADO';
    creado_por_nombre: string;
    fecha_creacion: string;
    observaciones?: string;
}

export interface Transaccion {
    id: number;
    presupuesto_id: number;
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    descripcion: string;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EJECUTADA';
    categoria: string;
    solicitante_nombre: string;
    fecha_creacion: string;
}

export const financieroService = {
    // Centros
    getCentros: () => 
        apiClient.get<CentroFinanciero[]>('/api/financiero/centros/'),
    
    getCentro: (id: number) =>
        apiClient.get<CentroFinanciero>(`/api/financiero/centros/${id}/`),
    
    createCentro: (data: any) =>
        apiClient.post('/api/financiero/centros/', data),
    
    updateCentro: (id: number, data: any) =>
        apiClient.put(`/api/financiero/centros/${id}/`, data),
    
    // Presupuestos
    getPresupuestos: () =>
        apiClient.get<Presupuesto[]>('/api/financiero/presupuestos/'),
    
    getPresupuestosPorCentro: (centroId: number) =>
        apiClient.get<Presupuesto[]>(
            `/api/financiero/presupuestos/por_centro/?centro_id=${centroId}`
        ),
    
    createPresupuesto: (data: any) =>
        apiClient.post('/api/financiero/presupuestos/', data),
    
    aprobarPresupuesto: (id: number) =>
        apiClient.post(`/api/financiero/presupuestos/${id}/aprobar/`, {}),
    
    // Transacciones
    getTransacciones: () =>
        apiClient.get<Transaccion[]>('/api/financiero/transacciones/'),
    
    createTransaccion: (data: any) =>
        apiClient.post('/api/financiero/transacciones/', data),
    
    aprobarTransaccion: (id: number) =>
        apiClient.post(`/api/financiero/transacciones/${id}/aprobar/`, {}),
    
    rechazarTransaccion: (id: number) =>
        apiClient.post(`/api/financiero/transacciones/${id}/rechazar/`, {})
};
```

#### 3.4 Crear Páginas

```tsx
// src/pages/financiero/GestionFinanciera.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { financieroService, type Presupuesto } from '../../services/api/financiero';
import { Button } from '../../components/ui/button';
import { useIsMobile } from '../../hooks/useIsMobile';
import { DollarSign, Plus, Eye, Edit2, Trash2 } from 'lucide-react';

export default function GestionFinanciera() {
    const isMobile = useIsMobile();
    const { hasEditPermission } = useAuth();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [loading, setLoading] = useState(true);
    
    const canEdit = hasEditPermission('Gestión Financiera');
    
    useEffect(() => {
        loadPresupuestos();
    }, []);
    
    const loadPresupuestos = async () => {
        try {
            setLoading(true);
            const data = await financieroService.getPresupuestos();
            setPresupuestos(data);
        } catch (error) {
            console.error('Error cargando presupuestos:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAprobar = async (id: number) => {
        try {
            await financieroService.aprobarPresupuesto(id);
            loadPresupuestos();
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    if (loading) {
        return (
            <div className={`${isMobile ? 'p-4' : 'p-8'} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
            {/* Header */}
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>
                            Gestión Financiera
                        </h1>
                        <p className="text-gray-500">Administra presupuestos y transacciones</p>
                    </div>
                </div>
                
                {canEdit && (
                    <Button className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Presupuesto
                    </Button>
                )}
            </div>
            
            {/* Estadísticas */}
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Total Presupuesto</p>
                    <p className="text-2xl font-bold">
                        ${presupuestos.reduce((sum, p) => sum + p.monto_total, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Ejecutado</p>
                    <p className="text-2xl font-bold">
                        ${presupuestos.reduce((sum, p) => sum + p.monto_ejecutado, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Disponible</p>
                    <p className="text-2xl font-bold">
                        ${presupuestos.reduce((sum, p) => sum + p.monto_disponible, 0).toLocaleString()}
                    </p>
                </div>
            </div>
            
            {/* Tabla */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-semibold">Centro</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Período</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Ejecutado</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                            {!isMobile && canEdit && (
                                <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {presupuestos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{p.centro_nombre}</td>
                                <td className="px-4 py-3">{p.periodo_nombre}</td>
                                <td className="px-4 py-3">${p.monto_total.toLocaleString()}</td>
                                <td className="px-4 py-3">${p.monto_ejecutado.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded text-xs font-semibold"
                                        style={{
                                            backgroundColor: p.estado === 'APROBADO' ? '#dcfce7' : 
                                                            p.estado === 'EJECUTANDO' ? '#dbeafe' : '#f3f4f6',
                                            color: p.estado === 'APROBADO' ? '#166534' :
                                                   p.estado === 'EJECUTANDO' ? '#1e40af' : '#374151'
                                        }}
                                    >
                                        {p.estado}
                                    </span>
                                </td>
                                {!isMobile && canEdit && (
                                    <td className="px-4 py-3 space-x-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="text-green-600 hover:text-green-800"
                                            onClick={() => handleAprobar(p.id)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

#### 3.5 Agregar Rutas en AppRouter.tsx

```typescript
// src/router/AppRouter.tsx
const GestionFinanciera = lazy(() => 
    import('../pages/financiero/GestionFinanciera')
);

const ReportesFinancieros = lazy(() => 
    import('../pages/financiero/ReportesFinancieros')
);

// En las rutas:
<Route path="/admin/financiero" element={
    <ProtectedRoute requiredComponent="Gestión Financiera">
        <GestionFinanciera />
    </ProtectedRoute>
} />

<Route path="/admin/reportes-financieros" element={
    <ProtectedRoute requiredComponent="Reportes Financieros">
        <ReportesFinancieros />
    </ProtectedRoute>
} />
```

---

### FASE 4: Testing

#### 4.1 Test de Permisos

```bash
# Test login como admin
curl -X POST http://localhost:8000/usuarios/login/ \
  -H "Content-Type: application/json" \
  -d '{"correo": "admin@universidad.edu", "contrasena": "pass123"}'

# Debe incluir en respuesta:
# "componentes": [
#   {"id": 1, "nombre": "Gestión Financiera", "permiso": "EDITAR"},
#   ...
# ]
```

#### 4.2 Test Frontend

```tsx
// Verificar que aparece en menú
// 1. Hacer login como admin
// 2. Revisar que menú tiene sección "Financiero"
// 3. Clic en "Gestión Financiera"
// 4. Verificar que carga page sin "Acceso Denegado"
```

---

## ✅ CHECKLIST FINAL

### Backend
- [ ] App `financiero` creada
- [ ] Modelos definidos (Presupuesto, Transaccion, etc)
- [ ] Serializers creados
- [ ] ViewSets creados
- [ ] URLs registradas en `mysite/urls.py`
- [ ] App agregada a `INSTALLED_APPS`
- [ ] Migrations ejecutadas
- [ ] Componentes creados en DB
- [ ] ComponenteRol asignados

### Frontend
- [ ] `componentRoutes.ts` actualizado
- [ ] `useAdminDashboard.ts` actualizado (sección financiero)
- [ ] API service creado (`financiero.ts`)
- [ ] Páginas creadas (GestionFinanciera, ReportesFinancieros)
- [ ] Rutas agregadas en AppRouter
- [ ] Import lazy de componentes

### Testing
- [ ] Login devuelve componentes financieros
- [ ] Menú muestra sección Financiero
- [ ] ProtectedRoute funciona (bloquea sin permiso)
- [ ] Página carga sin errores
- [ ] CRUD básico funciona

---

## 🚀 DESPUÉS DE INTEGRACIÓN

Una vez funcionando:

1. **Personalizar permisos**: Crear más roles (auditor, contador, etc.)
2. **Reportes**: Agregar generación de PDF/Excel
3. **Notificaciones**: Avisar cuando transacciones necesitan aprobación
4. **Gráficos**: Dashboards con charts de Recharts o Chart.js
5. **Importación**: Bulk upload de presupuestos desde Excel
6. **Integración con reporte académico**: Ligar gasto → actividades académicas

---

**Notas finales**:
- El código anterior es de EJEMPLO, ajustar según tu estructura exacta
- Validaciones de permisos más robustas en backend (middleware)
- Considerar auditoría automática con django-auditlog
- Test unitarios para modelos y views
