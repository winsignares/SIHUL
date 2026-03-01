/**
 * SearchableSelect - Componente reutilizable de selección con búsqueda
 * Basado en el patrón de Popover + Command para selección de items con filtrado
 * 
 * @example
 * ```tsx
 * <SearchableSelect
 *   items={docentes}
 *   value={selectedId}
 *   onSelect={(item) => setSelectedId(item.id)}
 *   getItemId={(item) => item.id}
 *   getItemLabel={(item) => item.nombre}
 *   getItemSecondary={(item) => item.correo}
 *   placeholder="Seleccionar docente..."
 *   searchPlaceholder="Buscar docente..."
 *   emptyMessage="No se encontró ningún docente."
 *   clearable
 *   onClear={() => setSelectedId(null)}
 * />
 * ```
 */

import { useState, useMemo } from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Check, ChevronsUpDown, X } from 'lucide-react';

export interface SearchableSelectProps<T> {
  /** Lista de items a mostrar */
  items: T[];
  
  /** Valor seleccionado actualmente (puede ser el ID o el objeto completo) */
  value: any;
  
  /** Callback cuando se selecciona un item */
  onSelect: (item: T) => void;
  
  /** Función para obtener el ID único de cada item */
  getItemId: (item: T) => string | number;
  
  /** Función para obtener el label principal de cada item */
  getItemLabel: (item: T) => string;
  
  /** Función opcional para obtener información secundaria del item */
  getItemSecondary?: (item: T) => string | null | undefined;
  
  /** Placeholder cuando no hay selección */
  placeholder?: string;
  
  /** Placeholder del input de búsqueda */
  searchPlaceholder?: string;
  
  /** Mensaje cuando no se encuentran resultados */
  emptyMessage?: string;
  
  /** Si es true, muestra un botón para limpiar la selección */
  clearable?: boolean;
  
  /** Callback cuando se limpia la selección */
  onClear?: () => void;
  
  /** Función personalizada de filtrado (opcional) */
  filterFn?: (item: T, searchTerm: string) => boolean;
  
  /** Número máximo de items a mostrar en la lista (default: 50) */
  maxItems?: number;
  
  /** Clase CSS adicional para el botón trigger */
  className?: string;
  
  /** Si el componente está deshabilitado */
  disabled?: boolean;
  
  /** Renderizador personalizado para cada item (opcional) */
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
}

export function SearchableSelect<T>({
  items,
  value,
  onSelect,
  getItemId,
  getItemLabel,
  getItemSecondary,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados.',
  clearable = false,
  onClear,
  filterFn,
  maxItems = 50,
  className = '',
  disabled = false,
  renderItem,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Encontrar el item seleccionado actualmente
  const selectedItem = useMemo(() => {
    if (!value) return null;
    return items.find(item => getItemId(item) === value) || null;
  }, [items, value, getItemId]);

  // Filtrar items según el término de búsqueda
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;

    const lowerSearch = searchTerm.toLowerCase();
    
    if (filterFn) {
      return items.filter(item => filterFn(item, lowerSearch));
    }

    // Filtrado por defecto: buscar en label y secondary
    return items.filter(item => {
      const label = getItemLabel(item).toLowerCase();
      const secondary = getItemSecondary?.(item)?.toLowerCase() || '';
      return label.includes(lowerSearch) || secondary.includes(lowerSearch);
    });
  }, [items, searchTerm, filterFn, getItemLabel, getItemSecondary]);

  // Limitar items mostrados
  const displayItems = filteredItems.slice(0, maxItems);

  const handleSelect = (item: T) => {
    onSelect(item);
    setSearchTerm('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    setSearchTerm('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${className}`}
            disabled={disabled}
          >
            <span className="truncate">
              {selectedItem ? getItemLabel(selectedItem) : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {displayItems.map((item) => {
                  const itemId = getItemId(item);
                  const isSelected = value === itemId;

                  return (
                    <CommandItem
                      key={String(itemId)}
                      value={String(itemId)}
                      onSelect={() => handleSelect(item)}
                      className="cursor-pointer"
                    >
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <>
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              isSelected ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate">{getItemLabel(item)}</span>
                            {getItemSecondary && getItemSecondary(item) && (
                              <span className="text-xs text-slate-500 truncate">
                                {getItemSecondary(item)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {filteredItems.length > maxItems && (
                <div className="p-2 text-xs text-center text-slate-500 border-t">
                  Mostrando {maxItems} de {filteredItems.length} resultados
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {clearable && value && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
          title="Limpiar selección"
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default SearchableSelect;
