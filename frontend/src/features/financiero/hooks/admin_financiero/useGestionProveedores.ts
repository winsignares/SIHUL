import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { catalogosProveedoresService, proveedoresService } from '../../services';
import type {
  BancoCatalogo,
  CiudadCatalogo,
  DepartamentoGeograficoCatalogo,
  PaisCatalogo,
  Proveedor,
  TipoCuentaCatalogo,
} from '../../models/core.models';
import {
  emptyForm,
  getErrorMessage,
  normalizeText,
  toArray,
  type ProveedorFormState,
  type ProveedorUI,
} from './gestionProveedoresUtils';
import { useActualizacionEnVivo } from '../../../../hooks/useActualizacionEnVivo';

/** Estado y acciones de la gestión de proveedores. */
export function useGestionProveedores() {
  const [proveedores, setProveedores] = useState<ProveedorUI[]>([]);
  const [paises, setPaises] = useState<PaisCatalogo[]>([]);
  const [departamentosGeo, setDepartamentosGeo] = useState<DepartamentoGeograficoCatalogo[]>([]);
  const [ciudades, setCiudades] = useState<CiudadCatalogo[]>([]);
  const [bancos, setBancos] = useState<BancoCatalogo[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuentaCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accionProveedorId, setAccionProveedorId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [ciudadFilter, setCiudadFilter] = useState('all');
  const [form, setForm] = useState<ProveedorFormState>(emptyForm);

  const paisesById = useMemo(() => Object.fromEntries(paises.map((item) => [item.id, item])), [paises]);
  const departamentosById = useMemo(() => Object.fromEntries(departamentosGeo.map((item) => [item.id, item])), [departamentosGeo]);
  const ciudadesById = useMemo(() => Object.fromEntries(ciudades.map((item) => [item.id, item])), [ciudades]);
  const bancosById = useMemo(() => Object.fromEntries(bancos.map((item) => [item.id, item])), [bancos]);
  const tiposCuentaById = useMemo(() => Object.fromEntries(tiposCuenta.map((item) => [item.id, item])), [tiposCuenta]);

  const findPaisIdByName = useCallback((nombre?: string) => {
    const match = paises.find((item) => normalizeText(item.nombre) === normalizeText(nombre));
    return match ? String(match.id) : '';
  }, [paises]);

  const findDepartamentoIdByName = useCallback((nombre?: string, paisId?: string) => {
    const match = departamentosGeo.find((item) =>
      normalizeText(item.nombre) === normalizeText(nombre) &&
      (!paisId || String(item.pais_id) === paisId)
    );
    return match ? String(match.id) : '';
  }, [departamentosGeo]);

  const findCiudadIdByName = useCallback((nombre?: string, departamentoId?: string) => {
    const match = ciudades.find((item) =>
      normalizeText(item.nombre) === normalizeText(nombre) &&
      (!departamentoId || String(item.departamento_id) === departamentoId)
    );
    return match ? String(match.id) : '';
  }, [ciudades]);

  const findBancoIdByName = useCallback((nombre?: string) => {
    const match = bancos.find((item) => normalizeText(item.nombre) === normalizeText(nombre));
    return match ? String(match.id) : '';
  }, [bancos]);

  const findTipoCuentaIdByName = useCallback((nombre?: string) => {
    const match = tiposCuenta.find((item) => normalizeText(item.nombre) === normalizeText(nombre));
    return match ? String(match.id) : '';
  }, [tiposCuenta]);

  const cargarCatalogos = useCallback(async () => {
    const [paisesResp, departamentosResp, ciudadesResp, bancosResp, tiposCuentaResp] = await Promise.all([
      catalogosProveedoresService.getPaises(),
      catalogosProveedoresService.getDepartamentos(),
      catalogosProveedoresService.getCiudades(),
      catalogosProveedoresService.getBancos(),
      catalogosProveedoresService.getTiposCuenta(),
    ]);

    setPaises(paisesResp);
    setDepartamentosGeo(departamentosResp);
    setCiudades(ciudadesResp);
    setBancos(bancosResp);
    setTiposCuenta(tiposCuentaResp);
  }, []);

  // Alguien más cambió estos datos: se vuelve a leer sin mostrar el spinner.
  useActualizacionEnVivo(['proveedores', 'catalogos-financieros'], () => {
    void cargar({ silent: true });
  });

  const cargar = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    try {
      const proveedoresResp = await proveedoresService.getAll({ limit: 500, ordering: '-id' });

      setProveedores(toArray<ProveedorUI>(proveedoresResp));
      await cargarCatalogos();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No se pudieron cargar los proveedores.'));
    } finally {
      setLoading(false);
    }
  }, [cargarCatalogos]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ciudadesDisponiblesFiltro = useMemo(
    () => Array.from(new Set(proveedores.map((p) => (p.ciudad || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [proveedores]
  );

  const filtered = useMemo(() => {
    const query = normalizeText(search);
    const base = proveedores.filter((p) => {
      if (estadoFilter !== 'all' && p.estado !== estadoFilter) return false;
      if (tipoFilter !== 'all' && p.tipo_proveedor !== tipoFilter) return false;
      if (ciudadFilter !== 'all' && (p.ciudad || '').trim() !== ciudadFilter) return false;
      if (!query) return true;
      return [p.nit, p.razon_social, p.email || '', p.ciudad || '', p.tipo_proveedor].some((value) => normalizeText(value).includes(query));
    });

    return [...base].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [proveedores, search, estadoFilter, tipoFilter, ciudadFilter]);

  const departamentosDisponibles = useMemo(() => {
    if (form.ciudad_id) {
      const ciudad = ciudadesById[Number(form.ciudad_id)];
      if (ciudad) {
        const departamento = departamentosById[ciudad.departamento_id];
        return departamento ? [departamento] : [];
      }
    }

    return departamentosGeo.filter((item) => !form.pais_id || String(item.pais_id) === form.pais_id);
  }, [form.ciudad_id, form.pais_id, ciudadesById, departamentosById, departamentosGeo]);

  const ciudadesDisponibles = useMemo(() => {
    if (form.departamento_geo_id) {
      return ciudades.filter((item) => String(item.departamento_id) === form.departamento_geo_id);
    }

    if (form.pais_id) {
      return ciudades.filter((item) => String(item.pais_id) === form.pais_id);
    }

    return ciudades;
  }, [ciudades, form.departamento_geo_id, form.pais_id]);

  const syncPaisDepartamentoCiudad = useCallback((next: Partial<ProveedorFormState>) => {
    setForm((prev) => {
      const merged = { ...prev, ...next };

      if (merged.ciudad_id) {
        const ciudad = ciudadesById[Number(merged.ciudad_id)];
        if (ciudad) {
          merged.departamento_geo_id = String(ciudad.departamento_id);
          merged.pais_id = String(ciudad.pais_id);
        }
      } else if (merged.departamento_geo_id) {
        const departamento = departamentosById[Number(merged.departamento_geo_id)];
        if (departamento) {
          merged.pais_id = String(departamento.pais_id);
        }
      }

      if (merged.departamento_geo_id && merged.ciudad_id) {
        const ciudad = ciudadesById[Number(merged.ciudad_id)];
        if (!ciudad || String(ciudad.departamento_id) !== merged.departamento_geo_id) {
          merged.ciudad_id = '';
        }
      }

      if (merged.pais_id && merged.departamento_geo_id) {
        const departamento = departamentosById[Number(merged.departamento_geo_id)];
        if (!departamento || String(departamento.pais_id) !== merged.pais_id) {
          merged.departamento_geo_id = '';
          merged.ciudad_id = '';
        }
      }

      if (!merged.pais_id) {
        merged.departamento_geo_id = '';
        merged.ciudad_id = '';
      }

      return merged;
    });
  }, [ciudadesById, departamentosById]);

  const abrirNuevo = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const abrirEdicion = (proveedor: ProveedorUI) => {
    const paisId = findPaisIdByName(proveedor.pais);
    const departamentoId = findDepartamentoIdByName(proveedor.departamento, paisId);
    const ciudadId = findCiudadIdByName(proveedor.ciudad, departamentoId);

    setEditingId(proveedor.id);
    setForm({
      usuario: proveedor.usuario ?? null,
      nombreUsuario: proveedor.usuario_nombre || '',
      correoUsuario: proveedor.usuario_correo || '',
      nuevaContrasena: '',
      nit: proveedor.nit || '',
      razon_social: proveedor.razon_social || '',
      nombre_comercial: proveedor.nombre_comercial || '',
      tipo_proveedor: proveedor.tipo_proveedor || 'Servicios',
      tipo_persona: proveedor.tipo_persona || 'Jurídica',
      direccion: proveedor.direccion || '',
      pais_id: paisId,
      departamento_geo_id: departamentoId,
      ciudad_id: ciudadId,
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      contacto_principal: proveedor.contacto_principal || '',
      telefono_contacto: proveedor.telefono_contacto || '',
      banco_id: findBancoIdByName(proveedor.banco),
      tipo_cuenta_id: findTipoCuentaIdByName(proveedor.tipo_cuenta),
      numero_cuenta: proveedor.numero_cuenta || '',
      regimen_tributario: proveedor.regimen_tributario || '',
      observaciones: proveedor.observaciones || '',
      estado: proveedor.estado || 'Activo',
    });
    setDialogOpen(true);
  };

  const buildProveedorPayload = (source: ProveedorFormState) => {
    const ciudad = source.ciudad_id ? ciudadesById[Number(source.ciudad_id)] : undefined;
    const departamento = source.departamento_geo_id ? departamentosById[Number(source.departamento_geo_id)] : undefined;
    const pais = source.pais_id ? paisesById[Number(source.pais_id)] : undefined;
    const banco = source.banco_id ? bancosById[Number(source.banco_id)] : undefined;
    const tipoCuenta = source.tipo_cuenta_id ? tiposCuentaById[Number(source.tipo_cuenta_id)] : undefined;

    return {
      nit: source.nit.trim(),
      razon_social: source.razon_social.trim(),
      nombre_comercial: source.nombre_comercial.trim() || undefined,
      tipo_proveedor: source.tipo_proveedor,
      tipo_persona: source.tipo_persona,
      direccion: source.direccion.trim() || undefined,
      pais_id: source.pais_id ? Number(source.pais_id) : undefined,
      departamento_geo_id: source.departamento_geo_id ? Number(source.departamento_geo_id) : undefined,
      ciudad_id: source.ciudad_id ? Number(source.ciudad_id) : undefined,
      pais: pais?.nombre || undefined,
      departamento: departamento?.nombre || undefined,
      ciudad: ciudad?.nombre || undefined,
      telefono: source.telefono.trim() || undefined,
      email: source.email.trim() || undefined,
      contacto_principal: source.contacto_principal.trim() || undefined,
      telefono_contacto: source.telefono_contacto.trim() || undefined,
      banco_id: source.banco_id ? Number(source.banco_id) : undefined,
      banco: banco?.nombre || undefined,
      tipo_cuenta_id: source.tipo_cuenta_id ? Number(source.tipo_cuenta_id) : undefined,
      tipo_cuenta: tipoCuenta?.nombre || undefined,
      numero_cuenta: source.numero_cuenta.trim() || undefined,
      regimen_tributario: source.regimen_tributario || undefined,
      observaciones: source.observaciones.trim() || undefined,
      estado: source.estado,
    };
  };

  const guardar = async () => {
    if (!form.razon_social.trim() || !form.nit.trim() || !form.tipo_proveedor || !form.tipo_persona) {
      toast.error('Razón social, NIT, tipo de proveedor y tipo de persona son obligatorios.');
      return;
    }

    if (!editingId && (!form.nombreUsuario.trim() || !form.correoUsuario.trim() || !form.nuevaContrasena.trim())) {
      toast.error('Para crear el proveedor también debes diligenciar nombre, correo de acceso y contraseña.');
      return;
    }

    setSaving(true);
    try {
      const proveedorPayload = buildProveedorPayload(form);

      if (editingId) {
        await proveedoresService.update(editingId, {
          ...proveedorPayload,
          ...(form.usuario && form.nombreUsuario.trim() ? { usuario_nombre: form.nombreUsuario.trim() } : {}),
          ...(form.usuario && form.correoUsuario.trim() ? { usuario_correo: form.correoUsuario.trim() } : {}),
          ...(form.usuario && form.nuevaContrasena.trim() ? { usuario_contrasena: form.nuevaContrasena.trim() } : {}),
        });

        toast.success('Proveedor actualizado correctamente.');
      } else {
        await proveedoresService.crearConUsuario({
          nombre: form.nombreUsuario.trim(),
          correo: form.correoUsuario.trim(),
          contrasena: form.nuevaContrasena.trim(),
          ...proveedorPayload,
        });
        toast.success('Proveedor creado correctamente con su usuario de acceso.');
      }

      setDialogOpen(false);
      setForm({ ...emptyForm });
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible guardar el proveedor.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (proveedor: ProveedorUI) => {
    const nextEstado: Proveedor['estado'] = proveedor.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setAccionProveedorId(proveedor.id);
    try {
      await proveedoresService.update(proveedor.id, { estado: nextEstado });
      toast.success(`Proveedor ${nextEstado.toLowerCase()} correctamente.`);
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible cambiar el estado del proveedor.'));
    } finally {
      setAccionProveedorId(null);
    }
  };

  const eliminarProveedor = async (proveedor: ProveedorUI) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar a ${proveedor.razon_social}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    setAccionProveedorId(proveedor.id);
    try {
      await proveedoresService.delete(proveedor.id);
      toast.success('Proveedor eliminado correctamente.');
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible eliminar el proveedor.'));
    } finally {
      setAccionProveedorId(null);
    }
  };

  const limpiarFiltros = () => {
    setSearch('');
    setEstadoFilter('all');
    setTipoFilter('all');
    setCiudadFilter('all');
  };

  return {
    search, setSearch, estadoFilter, setEstadoFilter, tipoFilter, setTipoFilter, ciudadFilter, setCiudadFilter,
    ciudadesDisponiblesFiltro, limpiarFiltros, loading, filtered, accionProveedorId,
    abrirNuevo, abrirEdicion, toggleEstado, eliminarProveedor,
    dialogOpen, setDialogOpen, editingId, form, setForm, syncPaisDepartamentoCiudad,
    paises, bancos, tiposCuenta, departamentosDisponibles, ciudadesDisponibles, saving, guardar,
  };
}
