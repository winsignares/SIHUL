import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Button } from '../share/button';
import { Input } from '../share/input';
import { Badge } from '../share/badge';
import { Search, Package, AlertTriangle, CheckCircle, XCircle, Edit, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';

interface Recurso {
  id: string;
  nombre: string;
  tipo: string;
  cantidad: number;
  disponibles: number;
  enUso: number;
  enMantenimiento: number;
  ubicacion: string;
  estado: 'disponible' | 'parcial' | 'agotado';
}

export default function GestionRecursos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');

  const [recursos] = useState<Recurso[]>([
    { id: '1', nombre: 'Proyector HD', tipo: 'Proyección', cantidad: 25, disponibles: 18, enUso: 5, enMantenimiento: 2, ubicacion: 'Almacén Central', estado: 'disponible' },
    { id: '2', nombre: 'Proyector 4K', tipo: 'Proyección', cantidad: 10, disponibles: 6, enUso: 3, enMantenimiento: 1, ubicacion: 'Almacén Central', estado: 'disponible' },
    { id: '3', nombre: 'Micrófono Inalámbrico', tipo: 'Audio', cantidad: 30, disponibles: 22, enUso: 8, enMantenimiento: 0, ubicacion: 'Sala Técnica', estado: 'disponible' },
    { id: '4', nombre: 'Micrófono de Solapa', tipo: 'Audio', cantidad: 15, disponibles: 10, enUso: 3, enMantenimiento: 2, ubicacion: 'Sala Técnica', estado: 'disponible' },
    { id: '5', nombre: 'Sistema de Sonido Portátil', tipo: 'Audio', cantidad: 12, disponibles: 8, enUso: 4, enMantenimiento: 0, ubicacion: 'Almacén B', estado: 'disponible' },
    { id: '6', nombre: 'Cámara de Videoconferencia', tipo: 'Video', cantidad: 8, disponibles: 2, enUso: 5, enMantenimiento: 1, ubicacion: 'Sala Técnica', estado: 'parcial' },
    { id: '7', nombre: 'Pantalla Portátil', tipo: 'Proyección', cantidad: 20, disponibles: 15, enUso: 5, enMantenimiento: 0, ubicacion: 'Almacén Central', estado: 'disponible' },
    { id: '8', nombre: 'Laptop Presentaciones', tipo: 'Computación', cantidad: 15, disponibles: 8, enUso: 7, enMantenimiento: 0, ubicacion: 'Sala Equipos', estado: 'disponible' },
    { id: '9', nombre: 'Adaptador HDMI', tipo: 'Conectividad', cantidad: 50, disponibles: 35, enUso: 15, enMantenimiento: 0, ubicacion: 'Almacén Central', estado: 'disponible' },
    { id: '10', nombre: 'Cable VGA', tipo: 'Conectividad', cantidad: 40, disponibles: 28, enUso: 12, enMantenimiento: 0, ubicacion: 'Almacén Central', estado: 'disponible' },
    { id: '11', nombre: 'Atril', tipo: 'Mobiliario', cantidad: 25, disponibles: 20, enUso: 5, enMantenimiento: 0, ubicacion: 'Almacén B', estado: 'disponible' },
    { id: '12', nombre: 'Pizarra Digital', tipo: 'Proyección', cantidad: 5, disponibles: 0, enUso: 4, enMantenimiento: 1, ubicacion: 'Aulas', estado: 'agotado' }
  ]);

  const tipos = ['todos', 'Proyección', 'Audio', 'Video', 'Computación', 'Conectividad', 'Mobiliario'];

  const filteredRecursos = recursos.filter(r => {
    const matchesSearch = r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || r.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const estadisticas = {
    totalRecursos: recursos.reduce((sum, r) => sum + r.cantidad, 0),
    disponibles: recursos.reduce((sum, r) => sum + r.disponibles, 0),
    enUso: recursos.reduce((sum, r) => sum + r.enUso, 0),
    enMantenimiento: recursos.reduce((sum, r) => sum + r.enMantenimiento, 0)
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">Disponible</Badge>;
      case 'parcial':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">Stock Bajo</Badge>;
      case 'agotado':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">Agotado</Badge>;
      default:
        return null;
    }
  };

  const getDisponibilidadColor = (disponibles: number, total: number) => {
    const porcentaje = (disponibles / total) * 100;
    if (porcentaje > 50) return 'bg-green-600';
    if (porcentaje > 20) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Inventario de Recursos Audiovisuales</h1>
        <p className="text-slate-600 dark:text-slate-400">Gestiona el inventario de equipos y recursos disponibles</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 mb-1">Total Recursos</p>
                <p className="text-purple-900 dark:text-purple-100">{estadisticas.totalRecursos}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 mb-1">Disponibles</p>
                <p className="text-green-900 dark:text-green-100">{estadisticas.disponibles}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 mb-1">En Uso</p>
                <p className="text-blue-900 dark:text-blue-100">{estadisticas.enUso}</p>
              </div>
              <XCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 mb-1">Mantenimiento</p>
                <p className="text-orange-900 dark:text-orange-100">{estadisticas.enMantenimiento}</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map(tipo => (
              <SelectItem key={tipo} value={tipo}>
                {tipo === 'todos' ? 'Todos los tipos' : tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Recursos */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredRecursos.map((recurso, index) => (
          <motion.div
            key={recurso.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-slate-900 dark:text-slate-100 mb-2">{recurso.nombre}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400">
                        {recurso.tipo}
                      </Badge>
                      {getEstadoBadge(recurso.estado)}
                    </div>
                  </div>
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Barra de disponibilidad */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Disponibilidad</span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {recurso.disponibles} / {recurso.cantidad}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`${getDisponibilidadColor(recurso.disponibles, recurso.cantidad)} h-3 rounded-full transition-all`}
                        style={{ width: `${(recurso.disponibles / recurso.cantidad) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="text-green-900 dark:text-green-100">{recurso.disponibles}</p>
                      <p className="text-green-600 dark:text-green-400">Disponibles</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-blue-900 dark:text-blue-100">{recurso.enUso}</p>
                      <p className="text-blue-600 dark:text-blue-400">En Uso</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <p className="text-orange-900 dark:text-orange-100">{recurso.enMantenimiento}</p>
                      <p className="text-orange-600 dark:text-orange-400">Mantenimiento</p>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Ubicación:</span>
                    <span className="text-slate-900 dark:text-slate-100">{recurso.ubicacion}</span>
                  </div>

                  {/* Alertas */}
                  {recurso.estado === 'agotado' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400">Sin recursos disponibles</span>
                    </div>
                  )}
                  {recurso.estado === 'parcial' && recurso.disponibles <= 3 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-yellow-600 dark:text-yellow-400">Stock bajo - considerar reposición</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRecursos.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          No se encontraron recursos
        </div>
      )}
    </div>
  );
}
