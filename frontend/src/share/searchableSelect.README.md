# SearchableSelect - Componente Reutilizable

## 📋 Descripción

`SearchableSelect` es un componente reutilizable de React/TypeScript para selección de items con búsqueda en tiempo real, basado en el patrón de Popover + Command utilizado en los selectores de docente y espacio de la funcionalidad de modificar horarios.

## ✨ Características

- 🔍 **Búsqueda en tiempo real** - Filtra opciones mientras el usuario escribe
- 📝 **Información secundaria** - Muestra subtexto debajo de cada opción
- 🧹 **Botón de limpiar** - Opción para resetear la selección
- 🎨 **Renderizado personalizable** - Define cómo se muestra cada item
- 🔧 **Filtrado custom** - Implementa tu propia lógica de búsqueda
- 🎯 **TypeScript** - Totalmente tipado para seguridad de tipos
- ⚡ **Optimizado** - Usa React.useMemo para mejor rendimiento
- ♿ **Accesible** - Soporte para teclado y lectores de pantalla

## 📁 Archivos Creados

```
frontend/src/
├── share/
│   ├── searchableSelect.tsx              # Componente principal
│   └── searchableSelect.examples.md      # Documentación y ejemplos
└── pages/
    └── examples/
        └── SearchableSelectExamples.tsx  # Componente de demostración
```

## 🚀 Uso Básico

```tsx
import { SearchableSelect } from '../../share/searchableSelect';

function MiComponente() {
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const docentes = [...]; // tus docentes

  return (
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
  );
}
```

## 📚 Ejemplos Completos

### 1. Selección de Docentes

```tsx
<SearchableSelect
  items={docentes}
  value={docenteId}
  onSelect={(doc) => setDocenteId(doc.id)}
  getItemId={(doc) => doc.id}
  getItemLabel={(doc) => doc.nombre}
  getItemSecondary={(doc) => doc.correo}
  placeholder="Seleccionar docente..."
  clearable
  onClear={() => setDocenteId(null)}
/>
```

### 2. Selección de Espacios

```tsx
<SearchableSelect
  items={espacios}
  value={espacioId}
  onSelect={(espacio) => setEspacioId(espacio.id)}
  getItemId={(espacio) => espacio.id}
  getItemLabel={(espacio) => espacio.nombre}
  getItemSecondary={(espacio) => `Capacidad: ${espacio.capacidad}`}
  placeholder="Seleccionar espacio..."
  searchPlaceholder="Buscar espacio..."
/>
```

### 3. Con Filtrado Personalizado

```tsx
const customFilter = (asignatura: Asignatura, searchTerm: string) => {
  return (
    asignatura.nombre.toLowerCase().includes(searchTerm) ||
    asignatura.codigo.toLowerCase().includes(searchTerm) ||
    asignatura.creditos.toString().includes(searchTerm)
  );
};

<SearchableSelect
  items={asignaturas}
  value={asignaturaId}
  onSelect={(asig) => setAsignaturaId(asig.id)}
  getItemId={(asig) => asig.id}
  getItemLabel={(asig) => `${asig.codigo} - ${asig.nombre}`}
  filterFn={customFilter}
  placeholder="Seleccionar asignatura..."
/>
```

### 4. Con Renderizado Personalizado

```tsx
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
/>
```

## 🔧 Props del Componente

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `items` | `T[]` | ✅ | - | Lista de items a mostrar |
| `value` | `any` | ✅ | - | Valor seleccionado (ID del item) |
| `onSelect` | `(item: T) => void` | ✅ | - | Callback al seleccionar un item |
| `getItemId` | `(item: T) => string \| number` | ✅ | - | Función para obtener el ID único |
| `getItemLabel` | `(item: T) => string` | ✅ | - | Función para obtener el label principal |
| `getItemSecondary` | `(item: T) => string \| null` | ❌ | - | Función para texto secundario (opcional) |
| `placeholder` | `string` | ❌ | 'Seleccionar...' | Texto cuando no hay selección |
| `searchPlaceholder` | `string` | ❌ | 'Buscar...' | Placeholder del input de búsqueda |
| `emptyMessage` | `string` | ❌ | 'No se encontraron resultados.' | Mensaje sin resultados |
| `clearable` | `boolean` | ❌ | `false` | Mostrar botón de limpiar |
| `onClear` | `() => void` | ❌ | - | Callback al limpiar selección |
| `filterFn` | `(item: T, search: string) => boolean` | ❌ | - | Lógica de filtrado personalizada |
| `maxItems` | `number` | ❌ | `50` | Máximo de items a mostrar |
| `className` | `string` | ❌ | `''` | Clases CSS adicionales |
| `disabled` | `boolean` | ❌ | `false` | Deshabilitar el componente |
| `renderItem` | `(item: T, isSelected: boolean) => ReactNode` | ❌ | - | Renderizado custom de items |

## 🎯 Casos de Uso

### ✅ Cuándo usar SearchableSelect

- Listas con más de 10 opciones
- Necesitas búsqueda/filtrado
- Quieres mostrar información adicional de cada opción
- Necesitas consistencia visual en toda la aplicación
- Trabajas con datos tipados en TypeScript

### ❌ Cuándo NO usar SearchableSelect

- Listas simples con menos de 5 opciones (usa `<Select>` normal)
- Múltiple selección (este componente es para selección única)
- Necesitas checkboxes o radio buttons

## 🔄 Migración desde Popover Manual

### Antes (código duplicado ~40 líneas)

```tsx
<Popover open={comboboxDocenteAbierto} onOpenChange={setComboboxDocenteAbierto}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox" className="w-full justify-between">
      {horarioEditar.docente_id 
        ? docentes.find((d) => d.id === horarioEditar.docente_id)?.nombre 
        : 'Seleccionar docente...'}
      <ChevronsUpDown className="ml-2 h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-0">
    <Command>
      <CommandInput placeholder="Buscar docente..." />
      <CommandList>
        <CommandEmpty>No se encontró ningún docente.</CommandEmpty>
        <CommandGroup>
          {docentesFiltrados.slice(0, 50).map((docente) => (
            <CommandItem key={docente.id} value={docente.nombre}>
              <Check className={/* ... */} />
              <div>
                <span>{docente.nombre}</span>
                <span>{docente.correo}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

### Después (componente reutilizable ~10 líneas)

```tsx
<SearchableSelect
  items={docentes}
  value={horarioEditar.docente_id}
  onSelect={(doc) => setHorarioEditar({ ...horarioEditar, docente_id: doc.id })}
  getItemId={(doc) => doc.id}
  getItemLabel={(doc) => doc.nombre}
  getItemSecondary={(doc) => doc.correo}
  placeholder="Seleccionar docente..."
  clearable
  onClear={() => setHorarioEditar({ ...horarioEditar, docente_id: null })}
/>
```

**Reducción**: De ~40 líneas a ~10 líneas ✨

## 📖 Documentación Adicional

- **Guía completa**: Ver `searchableSelect.examples.md`
- **Componente de demostración**: `pages/examples/SearchableSelectExamples.tsx`
- **Implementación real**: Ver `CentroHorarios.tsx` (modal de edición)

## 🧪 Probando el Componente

Para ver todos los ejemplos en acción:

1. Navega a la ruta de ejemplos (si está configurada en el router)
2. O importa `SearchableSelectExamples` en tu página de desarrollo
3. Experimenta con diferentes configuraciones

```tsx
import SearchableSelectExamples from './pages/examples/SearchableSelectExamples';

// Renderiza en tu ruta de desarrollo
<SearchableSelectExamples />
```

## 💡 Tips y Mejores Prácticas

1. **TypeScript**: Siempre define interfaces para tus items
2. **Búsqueda**: El filtrado por defecto busca en label y secondary
3. **Rendimiento**: El componente ya está optimizado con useMemo
4. **Accesibilidad**: Los labels son importantes para screen readers
5. **Botón limpiar**: Solo usar cuando tiene sentido (no es requerido)
6. **MaxItems**: Ajustar según tu caso (default: 50)

## 🔍 Filtrado Personalizado

El filtrado por defecto busca en `getItemLabel` y `getItemSecondary`. Para lógica más compleja:

```tsx
const customFilter = (item: MiTipo, searchTerm: string) => {
  // Tu lógica aquí
  return (
    item.campo1.toLowerCase().includes(searchTerm) ||
    item.campo2.includes(searchTerm) ||
    item.campo3.toString().includes(searchTerm)
  );
};

<SearchableSelect
  filterFn={customFilter}
  // ... otras props
/>
```

## 🎨 Personalización Visual

El componente usa las clases de Tailwind CSS. Puedes:

1. Agregar clases adicionales via `className`
2. Personalizar el renderizado completo con `renderItem`
3. Modificar el componente base si necesitas cambios globales

## 🚀 Beneficios

- ✅ **Reutilizable**: Un componente para todos los casos
- ✅ **Mantenible**: Cambios en un solo lugar
- ✅ **Consistente**: UI uniforme en toda la app
- ✅ **Tipado**: Type-safety con TypeScript
- ✅ **Accesible**: ARIA y navegación por teclado
- ✅ **Performante**: Optimizado con React hooks

## 📝 Cambios Realizados

1. ✅ Creado `searchableSelect.tsx` - Componente base
2. ✅ Actualizado `CentroHorarios.tsx` - Usa SearchableSelect
3. ✅ Actualizado `useCentroHorarios.ts` - Removido código duplicado
4. ✅ Creado `searchableSelect.examples.md` - Documentación
5. ✅ Creado `SearchableSelectExamples.tsx` - Demo interactiva

## 🤝 Contribuir

Para extender el componente:

1. Mantén la API consistente
2. Documenta nuevas props
3. Agrega ejemplos de uso
4. Mantén la accesibilidad
5. Prueba con TypeScript

## 📞 Soporte

Para preguntas o issues:
- Ver ejemplos en `searchableSelect.examples.md`
- Revisar componente de demo `SearchableSelectExamples.tsx`
- Consultar implementación real en `CentroHorarios.tsx`

---

**Creado**: Marzo 2026  
**Versión**: 1.0.0  
**Autor**: Sistema SIHUL
