from rest_framework import viewsets, filters, status, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from ..permissions import EsUsuarioFinanciero
from django.db import IntegrityError, transaction
from django_filters.rest_framework import DjangoFilterBackend
from .. import models, serializers
from usuarios.models import Usuario



class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = models.Proveedor.objects.select_related('usuario').all()
    serializer_class = serializers.ProveedorSerializer
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'tipo_proveedor']
    search_fields = ['nit', 'razon_social', 'email']
    ordering_fields = ['fecha_creacion', 'razon_social']
    ordering = ['-fecha_creacion']

    def _coerce_geo_catalog_data(self, payload):
        data = dict(payload)

        pais_id = data.pop('pais_id', None)
        departamento_id = data.pop('departamento_geo_id', None)
        ciudad_id = data.pop('ciudad_id', None)
        banco_id = data.pop('banco_id', None)
        tipo_cuenta_id = data.pop('tipo_cuenta_id', None)

        ciudad = None
        departamento = None
        pais = None

        if ciudad_id:
            ciudad = models.Ciudad.objects.filter(id=ciudad_id, activo=True).select_related('departamento__pais').first()
            if ciudad:
                departamento = ciudad.departamento
                pais = departamento.pais

        if departamento is None and departamento_id:
            departamento = models.DepartamentoGeografico.objects.filter(id=departamento_id, activo=True).select_related('pais').first()
            if departamento:
                pais = departamento.pais

        if pais is None and pais_id:
            pais = models.Pais.objects.filter(id=pais_id, activo=True).first()

        if ciudad:
            data['ciudad'] = ciudad.nombre
        if departamento:
            data['departamento'] = departamento.nombre
        if pais:
            data['pais'] = pais.nombre

        if banco_id:
            banco = models.Banco.objects.filter(id=banco_id, activo=True).first()
            if banco:
                data['banco'] = banco.nombre

        if tipo_cuenta_id:
            tipo_cuenta = models.TipoCuenta.objects.filter(id=tipo_cuenta_id, activo=True).first()
            if tipo_cuenta:
                data['tipo_cuenta'] = tipo_cuenta.nombre

        return data

    def create(self, request, *args, **kwargs):
        data = self._coerce_geo_catalog_data(request.data)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        from django.contrib.auth.hashers import make_password

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._coerce_geo_catalog_data(request.data)
        usuario_nombre = data.pop('usuario_nombre', None)
        usuario_correo = data.pop('usuario_correo', None)
        usuario_contrasena = data.pop('usuario_contrasena', None)

        usuario = instance.usuario
        if usuario is not None:
            if usuario_nombre is not None:
                usuario.nombre = str(usuario_nombre).strip()
            if usuario_correo is not None:
                correo_normalizado = str(usuario_correo).strip().lower()
                if not correo_normalizado:
                    raise ValidationError({'usuario_correo': 'El correo de acceso no puede estar vacío.'})
                if Usuario.objects.filter(correo__iexact=correo_normalizado).exclude(pk=usuario.pk).exists():
                    raise ValidationError({'usuario_correo': 'Ya existe un usuario con este correo.'})
                usuario.correo = correo_normalizado
            if usuario_contrasena:
                hashed = make_password(str(usuario_contrasena))
                usuario.password = hashed
                usuario.contrasena_hash = hashed
        elif any(value is not None for value in (usuario_nombre, usuario_correo, usuario_contrasena)):
            raise ValidationError({'usuario': 'El proveedor no tiene un usuario de acceso vinculado.'})

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if usuario is not None:
            usuario.activo = serializer.instance.estado == 'Activo'
            usuario.save()

        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        usuario = instance.usuario
        if usuario is not None:
            rol_nombre = (getattr(usuario.rol, 'nombre', '') or '').strip().casefold()
            if rol_nombre != 'proveedor':
                raise ValidationError({
                    'usuario': 'No se puede eliminar el proveedor porque el usuario vinculado no tiene rol Proveedor.'
                })
        self.perform_destroy(instance)
        if usuario is not None:
            usuario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=['post'],
        url_path='crear_con_usuario',
        permission_classes=[permissions.AllowAny],
    )
    def crear_con_usuario(self, request):
        """Crea un usuario con rol Proveedor y vincula su perfil en una transacción atómica."""
        from django.contrib.auth.hashers import make_password
        from usuarios.models import Rol

        nombre = (request.data.get('nombre') or '').strip()
        correo = (request.data.get('correo') or '').strip()
        contrasena = (request.data.get('contrasena') or '').strip()
        nit = (request.data.get('nit') or '').strip()
        razon_social = (request.data.get('razon_social') or '').strip()
        tipo_proveedor = (request.data.get('tipo_proveedor') or '').strip()

        if not all([nombre, correo, contrasena, nit, razon_social, tipo_proveedor]):
            return Response(
                {'error': 'Los campos nombre, correo, contrasena, nit, razon_social y tipo_proveedor son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        es_registro_publico = not getattr(request.user, 'is_authenticated', False)

        try:
            rol_proveedor = Rol.objects.get(nombre__iexact='Proveedor')
        except Rol.DoesNotExist:
            return Response(
                {'error': 'El rol "Proveedor" no existe en el sistema. Créalo antes de continuar.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Usuario.objects.filter(correo__iexact=correo).exists():
            return Response(
                {'error': f'Ya existe un usuario con el correo "{correo}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if models.Proveedor.objects.filter(nit=nit).exists():
            return Response(
                {'error': f'Ya existe un proveedor con el NIT "{nit}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        campos_opcionales = [
            'nombre_comercial', 'tipo_persona', 'direccion', 'ciudad', 'departamento',
            'pais', 'telefono', 'email', 'contacto_principal', 'telefono_contacto',
            'banco', 'tipo_cuenta', 'numero_cuenta', 'cuenta_bancaria_completa',
            'regimen_tributario', 'retencion_renta', 'retencion_iva', 'retencion_ica',
            'autoretenedor', 'estado', 'calificacion_riesgo', 'observaciones',
            'pais_id', 'departamento_geo_id', 'ciudad_id', 'banco_id', 'tipo_cuenta_id',
        ]

        proveedor_data = {'nit': nit, 'razon_social': razon_social, 'tipo_proveedor': tipo_proveedor}
        for campo in campos_opcionales:
            if campo in request.data:
                proveedor_data[campo] = request.data[campo]
        proveedor_data = self._coerce_geo_catalog_data(proveedor_data)

        # El registro público usa el correo y teléfono de acceso como datos
        # principales del proveedor, sin pedir campos de contacto duplicados.
        if es_registro_publico:
            proveedor_data['email'] = proveedor_data.get('email') or correo
            proveedor_data['contacto_principal'] = nombre
            proveedor_data['telefono_contacto'] = proveedor_data.get('telefono') or None

        try:
            with transaction.atomic():
                hashed = make_password(contrasena)
                nuevo_usuario = Usuario(
                    nombre=nombre,
                    correo=correo,
                    password=hashed,
                    contrasena_hash=hashed,
                    rol=rol_proveedor,
                    activo=True,
                )
                nuevo_usuario.save()

                proveedor_data['usuario'] = nuevo_usuario
                if getattr(request.user, 'is_authenticated', False):
                    proveedor_data['creado_por'] = request.user
                proveedor = models.Proveedor.objects.create(**proveedor_data)

        except IntegrityError as exc:
            return Response({'error': f'Error de integridad: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'usuario_id': nuevo_usuario.id,
                'proveedor': serializers.ProveedorSerializer(proveedor).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='mi_perfil')
    def mi_perfil(self, request):
        """Encuentra el proveedor asociado al usuario actual por vínculo directo, email o NIT."""
        user = request.user
        proveedor = models.Proveedor.objects.filter(usuario=user).first()

        # 1. Fallback por email del usuario
        if not proveedor and user.correo:
            proveedor = models.Proveedor.objects.filter(email__iexact=user.correo).first()

        # 2. Fallback por NIT pasado como query param
        if not proveedor:
            nit = (request.query_params.get('nit') or '').strip()
            if nit:
                proveedor = models.Proveedor.objects.filter(nit=nit).first()

        if proveedor and proveedor.usuario_id and proveedor.usuario_id != user.id:
            return Response(
                {'detail': 'Este proveedor ya está vinculado a otro usuario.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Auto-vincular en primer acceso para consolidar la relación usuario <-> proveedor
        if proveedor and not proveedor.usuario_id:
            proveedor.usuario = user
            proveedor.save(update_fields=['usuario'])

        if proveedor:
            return Response(serializers.ProveedorSerializer(proveedor).data)

        return Response(
            {'detail': 'No se encontró un proveedor asociado a este usuario.'},
            status=status.HTTP_404_NOT_FOUND
        )
