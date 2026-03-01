/**
 * SearchableSelectExamples - Componente de demostración
 * 
 * Este componente muestra diferentes casos de uso del SearchableSelect
 * Sirve como referencia y documentación viva del componente
 */

import { useState } from 'react';
import { SearchableSelect } from '../../share/searchableSelect';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Label } from '../../share/label';
import { Badge } from '../../share/badge';
import { Check, User, MapPin, BookOpen } from 'lucide-react';

// Tipos de ejemplo
interface Docente {
  id: number;
  nombre: string;
  correo: string;
  facultad: string;
}

interface Espacio {
  id: number;
  nombre: string;
  capacidad: number;
  tipo: 'aula' | 'laboratorio' | 'auditorio';
  disponible: boolean;
}

interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
}

// Datos de ejemplo
const docentesEjemplo: Docente[] = [
  { id: 1, nombre: 'Dr. Juan Pérez', correo: 'juan.perez@universidad.edu', facultad: 'Ingeniería' },
  { id: 2, nombre: 'Dra. María García', correo: 'maria.garcia@universidad.edu', facultad: 'Ciencias' },
  { id: 3, nombre: 'Dr. Carlos López', correo: 'carlos.lopez@universidad.edu', facultad: 'Ingeniería' },
  { id: 4, nombre: 'Dra. Ana Martínez', correo: 'ana.martinez@universidad.edu', facultad: 'Humanidades' },
  { id: 5, nombre: 'Dr. Luis Rodríguez', correo: 'luis.rodriguez@universidad.edu', facultad: 'Ciencias' },
];

const espaciosEjemplo: Espacio[] = [
  { id: 1, nombre: 'Aula 101', capacidad: 30, tipo: 'aula', disponible: true },
  { id: 2, nombre: 'Laboratorio A', capacidad: 20, tipo: 'laboratorio', disponible: true },
  { id: 3, nombre: 'Auditorio Principal', capacidad: 200, tipo: 'auditorio', disponible: false },
  { id: 4, nombre: 'Aula 202', capacidad: 40, tipo: 'aula', disponible: true },
  { id: 5, nombre: 'Laboratorio B', capacidad: 25, tipo: 'laboratorio', disponible: true },
];

const asignaturasEjemplo: Asignatura[] = [
  { id: 1, codigo: 'MAT101', nombre: 'Cálculo Diferencial', creditos: 4, semestre: 1 },
  { id: 2, codigo: 'FIS201', nombre: 'Física Mecánica', creditos: 3, semestre: 2 },
  { id: 3, codigo: 'PRG301', nombre: 'Programación Avanzada', creditos: 4, semestre: 3 },
  { id: 4, codigo: 'BDD401', nombre: 'Base de Datos', creditos: 3, semestre: 4 },
  { id: 5, codigo: 'ALG501', nombre: 'Algoritmos', creditos: 4, semestre: 5 },
];

export default function SearchableSelectExamples() {
  // Estados para cada ejemplo
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const [espacioId, setEspacioId] = useState<number | null>(null);
  const [asignaturaId, setAsignaturaId] = useState<number | null>(null);
  const [docenteFacultadId, setDocenteFacultadId] = useState<number | null>(null);
  const [espacioDisponibleId, setEspacioDisponibleId] = useState<number | null>(null);

  // Filtro personalizado para buscar en múltiples campos de asignatura
  const filtroAsignatura = (asignatura: Asignatura, searchTerm: string) => {
    return (
      asignatura.nombre.toLowerCase().includes(searchTerm) ||
      asignatura.codigo.toLowerCase().includes(searchTerm) ||
      asignatura.creditos.toString().includes(searchTerm) ||
      asignatura.semestre.toString().includes(searchTerm)
    );
  };

  // Filtro para mostrar solo docentes de ingeniería
  const docentesIngenieria = docentesEjemplo.filter(d => d.facultad === 'Ingeniería');

  // Filtro para mostrar solo espacios disponibles
  const espaciosDisponibles = espaciosEjemplo.filter(e => e.disponible);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          SearchableSelect - Ejemplos de Uso
        </h1>
        <p className="text-slate-600">
          Componente reutilizable de selección con búsqueda y filtrado
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ejemplo 1: Básico con información secundaria */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <User className="w-5 h-5" />
              Ejemplo 1: Selección Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">Seleccionar Docente</Label>
              <div className="mt-2">
                <SearchableSelect
                  items={docentesEjemplo}
                  value={docenteId}
                  onSelect={(docente) => setDocenteId(docente.id)}
                  getItemId={(docente) => docente.id}
                  getItemLabel={(docente) => docente.nombre}
                  getItemSecondary={(docente) => docente.correo}
                  placeholder="Seleccionar docente..."
                  searchPlaceholder="Buscar por nombre o correo..."
                  emptyMessage="No se encontró ningún docente."
                  clearable
                  onClear={() => setDocenteId(null)}
                />
              </div>
            </div>
            {docenteId && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Seleccionado:</strong>{' '}
                  {docentesEjemplo.find(d => d.id === docenteId)?.nombre}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  ID: {docenteId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ejemplo 2: Con información de capacidad */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <MapPin className="w-5 h-5" />
              Ejemplo 2: Con Datos Numéricos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">Seleccionar Espacio</Label>
              <div className="mt-2">
                <SearchableSelect
                  items={espaciosEjemplo}
                  value={espacioId}
                  onSelect={(espacio) => setEspacioId(espacio.id)}
                  getItemId={(espacio) => espacio.id}
                  getItemLabel={(espacio) => espacio.nombre}
                  getItemSecondary={(espacio) => `Capacidad: ${espacio.capacidad} personas`}
                  placeholder="Seleccionar espacio..."
                  searchPlaceholder="Buscar espacio..."
                  emptyMessage="No se encontró ningún espacio."
                  clearable
                  onClear={() => setEspacioId(null)}
                />
              </div>
            </div>
            {espacioId && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  <strong>Seleccionado:</strong>{' '}
                  {espaciosEjemplo.find(e => e.id === espacioId)?.nombre}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Capacidad: {espaciosEjemplo.find(e => e.id === espacioId)?.capacidad} personas
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ejemplo 3: Con filtrado personalizado */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <BookOpen className="w-5 h-5" />
              Ejemplo 3: Filtrado Personalizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">Seleccionar Asignatura</Label>
              <div className="mt-2">
                <SearchableSelect
                  items={asignaturasEjemplo}
                  value={asignaturaId}
                  onSelect={(asignatura) => setAsignaturaId(asignatura.id)}
                  getItemId={(asig) => asig.id}
                  getItemLabel={(asig) => `${asig.codigo} - ${asig.nombre}`}
                  getItemSecondary={(asig) => `${asig.creditos} créditos • Semestre ${asig.semestre}`}
                  filterFn={filtroAsignatura}
                  placeholder="Seleccionar asignatura..."
                  searchPlaceholder="Buscar por código, nombre, créditos o semestre..."
                  emptyMessage="No se encontró ninguna asignatura."
                />
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-purple-50 p-3 rounded border border-purple-200">
              <p className="font-semibold mb-1">Filtrado avanzado:</p>
              <p>Busca en código, nombre, créditos y semestre simultáneamente</p>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo 4: Con lista pre-filtrada */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <User className="w-5 h-5" />
              Ejemplo 4: Lista Pre-filtrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">Docentes de Ingeniería</Label>
              <div className="mt-2">
                <SearchableSelect
                  items={docentesIngenieria}
                  value={docenteFacultadId}
                  onSelect={(docente) => setDocenteFacultadId(docente.id)}
                  getItemId={(docente) => docente.id}
                  getItemLabel={(docente) => docente.nombre}
                  getItemSecondary={(docente) => docente.facultad}
                  placeholder="Seleccionar docente..."
                  searchPlaceholder="Buscar docente..."
                  clearable
                  onClear={() => setDocenteFacultadId(null)}
                />
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-orange-50 p-3 rounded border border-orange-200">
              <p className="font-semibold mb-1">Lista filtrada:</p>
              <p>Solo muestra docentes de la Facultad de Ingeniería</p>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo 5: Con renderizado personalizado */}
        <Card className="border-pink-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100">
            <CardTitle className="flex items-center gap-2 text-pink-900">
              <MapPin className="w-5 h-5" />
              Ejemplo 5: Renderizado Custom
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">Espacios Disponibles</Label>
              <div className="mt-2">
                <SearchableSelect
                  items={espaciosDisponibles}
                  value={espacioDisponibleId}
                  onSelect={(espacio) => setEspacioDisponibleId(espacio.id)}
                  getItemId={(espacio) => espacio.id}
                  getItemLabel={(espacio) => espacio.nombre}
                  placeholder="Seleccionar espacio disponible..."
                  searchPlaceholder="Buscar espacio..."
                  renderItem={(espacio, isSelected) => (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        <div>
                          <div className="font-medium">{espacio.nombre}</div>
                          <div className="text-xs text-slate-500">
                            {espacio.capacidad} personas
                          </div>
                        </div>
                      </div>
                      <Badge 
                        className={
                          espacio.tipo === 'aula' ? 'bg-blue-600' :
                          espacio.tipo === 'laboratorio' ? 'bg-green-600' :
                          'bg-purple-600'
                        }
                      >
                        {espacio.tipo}
                      </Badge>
                    </div>
                  )}
                  clearable
                  onClear={() => setEspacioDisponibleId(null)}
                />
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-pink-50 p-3 rounded border border-pink-200">
              <p className="font-semibold mb-1">Custom render:</p>
              <p>Incluye badges de colores según el tipo de espacio</p>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo 6: Sin información secundaria */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BookOpen className="w-5 h-5" />
              Ejemplo 6: Selección Simple
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">Solo Nombres de Asignaturas</Label>
              <div className="mt-2">
                <SearchableSelect
                  items={asignaturasEjemplo}
                  value={null}
                  onSelect={(asignatura) => console.log('Seleccionado:', asignatura)}
                  getItemId={(asig) => asig.id}
                  getItemLabel={(asig) => asig.nombre}
                  placeholder="Seleccionar asignatura..."
                  searchPlaceholder="Buscar..."
                  maxItems={3}
                />
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              <p className="font-semibold mb-1">Configurable:</p>
              <p>Sin información secundaria, máximo 3 items visibles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de características */}
      <Card className="border-slate-300 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
          <CardTitle className="text-slate-900">Características del Componente</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Badge className="bg-green-600 mt-1">✓</Badge>
              <div>
                <p className="font-medium text-slate-900">Búsqueda en tiempo real</p>
                <p className="text-sm text-slate-600">Filtra mientras escribes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-green-600 mt-1">✓</Badge>
              <div>
                <p className="font-medium text-slate-900">Información secundaria</p>
                <p className="text-sm text-slate-600">Muestra detalles adicionales</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-green-600 mt-1">✓</Badge>
              <div>
                <p className="font-medium text-slate-900">Botón de limpiar</p>
                <p className="text-sm text-slate-600">Opcional con onClear</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-green-600 mt-1">✓</Badge>
              <div>
                <p className="font-medium text-slate-900">Filtrado custom</p>
                <p className="text-sm text-slate-600">Define tu propia lógica</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-green-600 mt-1">✓</Badge>
              <div>
                <p className="font-medium text-slate-900">Renderizado custom</p>
                <p className="text-sm text-slate-600">Personaliza cada item</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-green-600 mt-1">✓</Badge>
              <div>
                <p className="font-medium text-slate-900">TypeScript</p>
                <p className="text-sm text-slate-600">Totalmente tipado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
