from .views import BancoViewSet, CentroCostoViewSet, CuentaContableViewSet, DepartamentoViewSet, TipoCuentaViewSet

registrations = [
    (r'departamentos', DepartamentoViewSet, 'departamento'),
    (r'cuentas-contables', CuentaContableViewSet, 'cuenta-contable'),
    (r'centros-costo', CentroCostoViewSet, 'centro-costo'),
    (r'bancos', BancoViewSet, 'banco'),
    (r'tipos-cuenta', TipoCuentaViewSet, 'tipo-cuenta'),
]
