import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Badge } from '../../share/badge';
import { Input } from '../../share/input';
import { Button } from '../../share/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Monitor,
  Wifi,
  Volume2,
  Projector,
  AirVent,
  Lightbulb,
  Eye,
  Info,
  Boxes
} from 'lucide-react';
import { db } from '../../hooks/database';
import type { EspacioFisico } from '../../hooks/models';

export default function EstadoRecursos() {
  const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<EspacioFisico | null>(null);

  useEffect(() => {
    loadEspacios();
  }, []);

  const loadEspacios = () => {
    setEspacios(db.getEspacios());
  };

  // Iconos para recursos
  const getRecursoIcon = (recurso: string) => {
    const recursoLower = recurso.toLowerCase();
    if (recursoLower.includes('computador') || recursoLower.includes('pc')) {
      return <Monitor className="w-4 h-4" />;
    }
    if (recursoLower.includes('proyector')) {
      return <Projector className="w-4 h-4" />;
    }
    if (recursoLower.includes('wifi') || recursoLower.includes('internet')) {
      return <Wifi className="w-4 h-4" />;
    }
    if (recursoLower.includes('audio') || recursoLower.includes('sonido')) {
      return <Volume2 className="w-4 h-4" />;
    }
    if (recursoLower.includes('aire') || recursoLower.includes('clima')) {
      return <AirVent className="w-4 h-4" />;
    }
    return <Lightbulb className="w-4 h-4" />;
  };

  // Filtrar espacios
  const espaciosFiltrados = espacios.filter(espacio => {
    const matchSearch = 
      espacio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      espacio.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filtroEstado === 'all' || espacio.estado === filtroEstado;
    const matchTipo = filtroTipo === 'all' || espacio.tipo === filtroTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  // Estadísticas
  const estadisticas = {
    total: espacios.length,
    disponibles: espacios.filter(e => e.estado === 'Disponible').length,
    mantenimiento: espacios.filter(e => e.estado === 'Mantenimiento').length,
    noDisponibles: espacios.filter(e => e.estado === 'No Disponible').length
  };

  // Icono de estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'Mantenimiento':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'Perdido':
        return <XCircle className="w-5 h-5 text-orange-600" />;
      case 'No Disponible':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  // Función para obtener el badge de estado de recurso
  const getEstadoRecursoBadge = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return <Badge className="bg-green-600">Disponible</Badge>;
      case 'Mantenimiento':
        return <Badge className="bg-yellow-600">Mantenimiento</Badge>;
      case 'Perdido':
        return <Badge className="bg-orange-600">Perdido</Badge>;
      case 'No Disponible':
        return <Badge className="bg-red-600">No Disponible</Badge>;
      default:
        return <Badge className="bg-slate-600">Desconocido</Badge>;
    }
  };

  // Función para obtener recursos con estado (genera estados aleatorios si no existen)
  const getRecursosConEstado = (espacio: EspacioFisico) => {
    if (espacio.recursosConEstado && espacio.recursosConEstado.length > 0) {
      return espacio.recursosConEstado;
    }
    
    // Si no hay recursosConEstado, generarlos desde recursos de forma DETERMINÍSTICA
    return espacio.recursos.map((recurso, index) => {
      // Crear un hash simple basado en el ID del espacio y el nombre del recurso
      const seed = espacio.id.charCodeAt(0) + recurso.charCodeAt(0) + index;
      const normalized = (seed % 100) / 100;
      
      let estado: 'Disponible' | 'Mantenimiento' | 'Perdido' | 'No Disponible';
      
      if (normalized < 0.7) estado = 'Disponible';
      else if (normalized < 0.85) estado = 'Mantenimiento';
      else if (normalized < 0.95) estado = 'No Disponible';
      else estado = 'Perdido';
      
      return { nombre: recurso, estado };
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 mb-2">Estado de Recursos por Espacio</h1>
        <p className="text-slate-600">Visualiza los recursos disponibles y el estado de cada espacio físico</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 mb-1">Total Espacios</p>
                <p className="text-slate-900 text-3xl">{estadisticas.total}</p>
              </div>
              <MapPin className="w-12 h-12 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 mb-1">Disponibles</p>
                <p className="text-green-900 text-3xl">{estadisticas.disponibles}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 mb-1">En Mantenimiento</p>
                <p className="text-yellow-900 text-3xl">{estadisticas.mantenimiento}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 mb-1">No Disponibles</p>
                <p className="text-red-900 text-3xl">{estadisticas.noDisponibles}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar espacio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Estado */}
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="Mantenimiento">En Mantenimiento</SelectItem>
                <SelectItem value="No Disponible">No Disponible</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por Tipo */}
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="aula">Aula</SelectItem>
                <SelectItem value="laboratorio">Laboratorio</SelectItem>
                <SelectItem value="auditorio">Auditorio</SelectItem>
                <SelectItem value="sala">Sala</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Espacios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {espaciosFiltrados.map((espacio) => (
          <Card 
            key={espacio.id} 
            className={`border-2 transition-all hover:shadow-xl ${
              espacio.estado === 'Disponible' 
                ? 'border-green-200 hover:border-green-400'
                : espacio.estado === 'Mantenimiento'
                ? 'border-yellow-200 hover:border-yellow-400'
                : 'border-red-200 hover:border-red-400'
            }`}
          >
            <CardHeader className={`${
              espacio.estado === 'Disponible'
                ? 'bg-green-50'
                : espacio.estado === 'Mantenimiento'
                ? 'bg-yellow-50'
                : 'bg-red-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-slate-900 mb-1">{espacio.nombre}</CardTitle>
                  <p className="text-slate-600">{espacio.codigo}</p>
                </div>
                {getEstadoIcon(espacio.estado)}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Información básica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tipo:</span>
                  <Badge variant="outline" className="capitalize">
                    {espacio.tipo}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Capacidad:</span>
                  <Badge className="bg-blue-600">
                    {espacio.capacidad} personas
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Sede:</span>
                  <span className="text-slate-900">{espacio.sede}</span>
                </div>
                {espacio.piso && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Piso:</span>
                    <span className="text-slate-900">{espacio.piso}</span>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600">Estado:</span>
                  <Badge
                    className={
                      espacio.estado === 'Disponible'
                        ? 'bg-green-600'
                        : espacio.estado === 'Mantenimiento'
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }
                  >
                    {espacio.estado}
                  </Badge>
                </div>
              </div>

              {/* Recursos */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-slate-600 mb-3">Recursos Disponibles:</p>
                {espacio.recursos && espacio.recursos.length > 0 ? (
                  <div className="space-y-2">
                    {getRecursosConEstado(espacio).map((recurso, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="text-blue-600">
                          {getRecursoIcon(recurso.nombre)}
                        </div>
                        <span className="text-slate-900 text-sm">{recurso.nombre}</span>
                        {getEstadoRecursoBadge(recurso.estado)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">Sin recursos registrados</p>
                )}
              </div>

              {/* Descripción */}
              {espacio.descripcion && (
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-slate-600 text-sm">{espacio.descripcion}</p>
                </div>
              )}

              {/* Botón DETALLES */}
              <div className="pt-3">
                <Button
                  onClick={() => {
                    setEspacioSeleccionado(espacio);
                    setShowDetallesModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  VER DETALLES
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sin resultados */}
      {espaciosFiltrados.length === 0 && (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No se encontraron espacios</p>
            <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalles */}
      <Dialog open={showDetallesModal} onOpenChange={setShowDetallesModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              Detalles Completos del Espacio
            </DialogTitle>
          </DialogHeader>

          {espacioSeleccionado && (
            <div className="space-y-6 py-4">
              {/* Información General */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Información General
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600 text-sm">Nombre:</p>
                    <p className="text-slate-900">{espacioSeleccionado.nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">Código:</p>
                    <p className="text-slate-900">{espacioSeleccionado.codigo}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">Tipo:</p>
                    <Badge variant="outline" className="capitalize">
                      {espacioSeleccionado.tipo}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">Capacidad:</p>
                    <Badge className="bg-blue-600">
                      {espacioSeleccionado.capacidad} personas
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">Sede:</p>
                    <p className="text-slate-900">{espacioSeleccionado.sede}</p>
                  </div>
                  {espacioSeleccionado.piso && (
                    <div>
                      <p className="text-slate-600 text-sm">Piso:</p>
                      <p className="text-slate-900">{espacioSeleccionado.piso}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-slate-600 text-sm">Estado del Espacio:</p>
                    <Badge
                      className={
                        espacioSeleccionado.estado === 'Disponible'
                          ? 'bg-green-600'
                          : espacioSeleccionado.estado === 'Mantenimiento'
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }
                    >
                      {getEstadoIcon(espacioSeleccionado.estado)}
                      <span className="ml-2">{espacioSeleccionado.estado}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {espacioSeleccionado.descripcion && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="text-slate-900 mb-2">Descripción</h3>
                  <p className="text-slate-700">{espacioSeleccionado.descripcion}</p>
                </div>
              )}

              {/* Recursos con Estado Detallado */}
              <div className="bg-white border border-slate-200 p-4 rounded-lg">
                <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-blue-600" />
                  Estado de Recursos del Espacio
                </h3>
                {getRecursosConEstado(espacioSeleccionado).length > 0 ? (
                  <div className="space-y-3">
                    {getRecursosConEstado(espacioSeleccionado).map((recurso, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${
                          recurso.estado === 'Disponible'
                            ? 'bg-green-50 border-green-200'
                            : recurso.estado === 'Mantenimiento'
                            ? 'bg-yellow-50 border-yellow-200'
                            : recurso.estado === 'Perdido'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                recurso.estado === 'Disponible'
                                  ? 'bg-green-100'
                                  : recurso.estado === 'Mantenimiento'
                                  ? 'bg-yellow-100'
                                  : recurso.estado === 'Perdido'
                                  ? 'bg-orange-100'
                                  : 'bg-red-100'
                              }`}
                            >
                              <div
                                className={
                                  recurso.estado === 'Disponible'
                                    ? 'text-green-600'
                                    : recurso.estado === 'Mantenimiento'
                                    ? 'text-yellow-600'
                                    : recurso.estado === 'Perdido'
                                    ? 'text-orange-600'
                                    : 'text-red-600'
                                }
                              >
                                {getRecursoIcon(recurso.nombre)}
                              </div>
                            </div>
                            <div>
                              <p className="text-slate-900">{recurso.nombre}</p>
                              <p className="text-slate-600 text-sm">
                                Estado actual del recurso
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getEstadoIcon(recurso.estado)}
                            {getEstadoRecursoBadge(recurso.estado)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No hay recursos registrados</p>
                  </div>
                )}
              </div>

              {/* Estadísticas de Recursos */}
              {getRecursosConEstado(espacioSeleccionado).length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-slate-900 mb-3">Estadísticas de Recursos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <p className="text-slate-600 text-sm">Total</p>
                      <p className="text-slate-900 text-xl">
                        {getRecursosConEstado(espacioSeleccionado).length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-green-700 text-sm">Disponibles</p>
                      <p className="text-green-900 text-xl">
                        {
                          getRecursosConEstado(espacioSeleccionado).filter(
                            (r) => r.estado === 'Disponible'
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-yellow-700 text-sm">Mantenimiento</p>
                      <p className="text-yellow-900 text-xl">
                        {
                          getRecursosConEstado(espacioSeleccionado).filter(
                            (r) => r.estado === 'Mantenimiento'
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-red-700 text-sm">Problemas</p>
                      <p className="text-red-900 text-xl">
                        {
                          getRecursosConEstado(espacioSeleccionado).filter(
                            (r) => r.estado === 'No Disponible' || r.estado === 'Perdido'
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowDetallesModal(false)}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}