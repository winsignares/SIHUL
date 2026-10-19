from .views import CiudadViewSet, DepartamentoGeograficoViewSet, PaisViewSet, ProveedorViewSet

registrations = [
    (r'proveedores', ProveedorViewSet, 'proveedor'),
    (r'paises', PaisViewSet, 'pais'),
    (r'departamentos-geograficos', DepartamentoGeograficoViewSet, 'departamento-geografico'),
    (r'ciudades', CiudadViewSet, 'ciudad'),
]
