# SearchableSelect - Guía de Uso

Componente reutilizable para selección con búsqueda, similar a los popovers de docente y espacio en modificar horarios.

## Características

- ✅ Búsqueda en tiempo real
- ✅ Soporte para información secundaria (subtexto)
- ✅ Botón de limpiar opcional
- ✅ Totalmente tipado con TypeScript
- ✅ Personalizable mediante props
- ✅ Renderizado customizable de items
- ✅ Límite configurable de items mostrados

## Ejemplos de Uso

### 1. Ejemplo Básico - Selección de Docentes

```tsx
import { SearchableSelect } from '../share/searchableSelect';

interface Docente {
  id: number;
  nombre: string;
  correo: string;
}

function MiComponente() {
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const docentes: Docente[] = [...]; // tus docentes

  return (
    <div>
      <Label>Docente</Label>
      <SearchableSelect
        items={docentes}
        value={docenteId}
        onSelect={(docente) => setDocenteId(docente.id)}
        getItemId={(docente) => docente.id}
        getItemLabel={(docente) => docente.nombre}
        getItemSecondary={(docente) => docente.correo}
        placeholder="Seleccionar docente..."
        searchPlaceholder="Buscar docente..."
        emptyMessage="No se encontró ningún docente."
        clearable
        onClear={() => setDocenteId(null)}
      />
    </div>
  );
}
```

### 2. Ejemplo - Selección de Espacios

```tsx
import { SearchableSelect } from '../share/searchableSelect';

interface Espacio {
  id: number;
  nombre: string;
  capacidad: number;
}

function MiComponente() {
  const [espacioId, setEspacioId] = useState<number | null>(null);
  const espacios: Espacio[] = [...]; // tus espacios

  return (
    <div>
      <Label>Espacio</Label>
      <SearchableSelect
        items={espacios}
        value={espacioId}
        onSelect={(espacio) => setEspacioId(espacio.id)}
        getItemId={(espacio) => espacio.id}
        getItemLabel={(espacio) => espacio.nombre}
        getItemSecondary={(espacio) => `Capacidad: ${espacio.capacidad}`}
        placeholder="Seleccionar espacio..."
        searchPlaceholder="Buscar espacio..."
        emptyMessage="No se encontró ningún espacio."
        clearable
        onClear={() => setEspacioId(null)}
      />
    </div>
  );
}
```

### 3. Ejemplo - Selección de Programas (Sin información secundaria)

```tsx
import { SearchableSelect } from '../share/searchableSelect';

interface Programa {
  id: number;
  nombre: string;
  codigo: string;
}

function MiComponente() {
  const [programaId, setProgramaId] = useState<number | null>(null);
  const programas: Programa[] = [...]; // tus programas

  return (
    <SearchableSelect
      items={programas}
      value={programaId}
      onSelect={(programa) => setProgramaId(programa.id)}
      getItemId={(programa) => programa.id}
      getItemLabel={(programa) => programa.nombre}
      placeholder="Seleccionar programa..."
      searchPlaceholder="Buscar programa..."
    />
  );
}
```

### 4. Ejemplo - Con Filtrado Personalizado

```tsx
import { SearchableSelect } from '../share/searchableSelect';

function MiComponente() {
  const [asignaturaId, setAsignaturaId] = useState<number | null>(null);

  // Filtrado personalizado que busca en múltiples campos
  const customFilter = (asignatura: Asignatura, searchTerm: string) => {
    return (
      asignatura.nombre.toLowerCase().includes(searchTerm) ||
      asignatura.codigo.toLowerCase().includes(searchTerm) ||
      asignatura.creditos.toString().includes(searchTerm)
    );
  };

  return (
    <SearchableSelect
      items={asignaturas}
      value={asignaturaId}
      onSelect={(asig) => setAsignaturaId(asig.id)}
      getItemId={(asig) => asig.id}
      getItemLabel={(asig) => `${asig.codigo} - ${asig.nombre}`}
      getItemSecondary={(asig) => `${asig.creditos} créditos`}
      filterFn={customFilter}
      placeholder="Seleccionar asignatura..."
    />
  );
}
```

### 5. Ejemplo - Con Renderizado Personalizado

```tsx
import { SearchableSelect } from '../share/searchableSelect';
import { Badge } from './badge';
import { Check } from 'lucide-react';

function MiComponente() {
  return (
    <SearchableSelect
      items={grupos}
      value={grupoId}
      onSelect={(grupo) => setGrupoId(grupo.id)}
      getItemId={(grupo) => grupo.id}
      getItemLabel={(grupo) => grupo.nombre}
      renderItem={(grupo, isSelected) => (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
            <div>
              <div className="font-medium">{grupo.nombre}</div>
              <div className="text-xs text-slate-500">Semestre {grupo.semestre}</div>
            </div>
          </div>
          <Badge className={grupo.activo ? 'bg-green-600' : 'bg-gray-600'}>
            {grupo.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      )}
      placeholder="Seleccionar grupo..."
    />
  );
}
```

### 6. Ejemplo - Con Límite de Items y Estado Deshabilitado

```tsx
function MiComponente() {
  const [loading, setLoading] = useState(false);

  return (
    <SearchableSelect
      items={docentes}
      value={docenteId}
      onSelect={(doc) => setDocenteId(doc.id)}
      getItemId={(doc) => doc.id}
      getItemLabel={(doc) => doc.nombre}
      maxItems={100} // Mostrar máximo 100 items
      disabled={loading} // Deshabilitar mientras carga
      placeholder="Seleccionar docente..."
    />
  );
}
```

## Props del Componente

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `items` | `T[]` | ✅ | - | Lista de items a mostrar |
| `value` | `any` | ✅ | - | Valor seleccionado (ID o objeto) |
| `onSelect` | `(item: T) => void` | ✅ | - | Callback al seleccionar |
| `getItemId` | `(item: T) => string \| number` | ✅ | - | Obtener ID del item |
| `getItemLabel` | `(item: T) => string` | ✅ | - | Obtener label principal |
| `getItemSecondary` | `(item: T) => string \| null` | ❌ | - | Obtener texto secundario |
| `placeholder` | `string` | ❌ | 'Seleccionar...' | Texto cuando no hay selección |
| `searchPlaceholder` | `string` | ❌ | 'Buscar...' | Placeholder del buscador |
| `emptyMessage` | `string` | ❌ | 'No se encontraron resultados.' | Mensaje cuando no hay resultados |
| `clearable` | `boolean` | ❌ | `false` | Mostrar botón de limpiar |
| `onClear` | `() => void` | ❌ | - | Callback al limpiar |
| `filterFn` | `(item: T, search: string) => boolean` | ❌ | - | Función de filtrado custom |
| `maxItems` | `number` | ❌ | `50` | Máximo de items a mostrar |
| `className` | `string` | ❌ | `''` | Clases CSS adicionales |
| `disabled` | `boolean` | ❌ | `false` | Deshabilitar el componente |
| `renderItem` | `(item: T, isSelected: boolean) => ReactNode` | ❌ | - | Renderizado custom de items |

## Integración con Formularios

### Con React Hook Form

```tsx
import { Controller } from 'react-hook-form';
import { SearchableSelect } from '../share/searchableSelect';

function MiFormulario() {
  const { control } = useForm();

  return (
    <Controller
      name="docente_id"
      control={control}
      render={({ field }) => (
        <SearchableSelect
          items={docentes}
          value={field.value}
          onSelect={(docente) => field.onChange(docente.id)}
          getItemId={(doc) => doc.id}
          getItemLabel={(doc) => doc.nombre}
          getItemSecondary={(doc) => doc.correo}
          placeholder="Seleccionar docente..."
          clearable
          onClear={() => field.onChange(null)}
        />
      )}
    />
  );
}
```

## Ventajas del Componente

1. **Reutilizable**: Un solo componente para todos los selects con búsqueda
2. **Tipado**: TypeScript garantiza type-safety
3. **Flexible**: Múltiples opciones de customización
4. **Consistente**: UI uniforme en toda la aplicación
5. **Accesible**: Soporta navegación por teclado y screen readers
6. **Performante**: Filtrado optimizado con useMemo

## Comparación: Antes vs Después

### Antes (código duplicado)

```tsx
// Para docente
<Popover open={comboboxDocenteAbierto} onOpenChange={setComboboxDocenteAbierto}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox" aria-expanded={comboboxDocenteAbierto} className="w-full justify-between">
      {horarioEditar.docente_id ? docentes.find((d) => d.id === horarioEditar.docente_id)?.nombre || 'Seleccionar docente...' : 'Seleccionar docente...'}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-0">
    <Command>
      <CommandInput placeholder="Buscar docente..." value={busquedaDocente} onValueChange={setBusquedaDocente} />
      <CommandList>
        <CommandEmpty>No se encontró ningún docente.</CommandEmpty>
        <CommandGroup>
          {docentesFiltrados.slice(0, 50).map((docente) => (
            <CommandItem key={docente.id} value={docente.nombre} onSelect={() => { /* ... */ }}>
              <Check className={`mr-2 h-4 w-4 ${horarioEditar.docente_id === docente.id ? 'opacity-100' : 'opacity-0'}`} />
              <div className="flex flex-col">
                <span>{docente.nombre}</span>
                <span className="text-xs text-slate-500">{docente.correo}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>

// Código similar repetido para espacio, asignatura, etc...
```

### Después (componente reutilizable)

```tsx
<SearchableSelect
  items={docentes}
  value={horarioEditar.docente_id}
  onSelect={(doc) => setHorarioEditar({ ...horarioEditar, docente_id: doc.id, docente_nombre: doc.nombre })}
  getItemId={(doc) => doc.id}
  getItemLabel={(doc) => doc.nombre}
  getItemSecondary={(doc) => doc.correo}
  placeholder="Seleccionar docente..."
  searchPlaceholder="Buscar docente..."
  emptyMessage="No se encontró ningún docente."
  clearable
  onClear={() => setHorarioEditar({ ...horarioEditar, docente_id: null, docente_nombre: '' })}
/>
```

**Reducción**: De ~40 líneas a ~10 líneas por cada selector ✨
