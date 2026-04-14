import { useState } from 'react';
import MisPendientesSLA from '../ui/mis-pendientes-sla';
import FacturaDetailModal from '../ui/factura-detail-modal';

export default function MisPendientes() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const facturasPendientes = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-137',
      proveedor: 'Inversiones Inmobiliarias Corp',
      valorTotal: 125000000,
      fechaAsignacion: '2026-03-27',
      diasTranscurridos: 2,
      diasMaximos: 2,
      nivelRiesgo: 'naranja' as const,
      etapaActual: 'Cargue Formal',
      areaSolicitante: 'Rectoría',
      observaciones: 'Arrendamiento sede Norte - Prioridad alta para cargue',
      fechaFactura: '2026-03-20',
      fechaRecepcion: '2026-03-27',
      estado: 'Aprobada Auditoría',
      descripcion: 'Arrendamiento campus Norte trimestre 2'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-146',
      proveedor: 'Proveedores Múltiples - Nómina',
      valorTotal: 285600000,
      fechaAsignacion: '2026-03-29',
      diasTranscurridos: 1,
      diasMaximos: 2,
      nivelRiesgo: 'amarillo' as const,
      etapaActual: 'Cargue Formal',
      areaSolicitante: 'Talento Humano',
      observaciones: 'Nómina quincenal - Cargar antes de las 3 PM',
      fechaFactura: '2026-03-28',
      fechaRecepcion: '2026-03-29',
      estado: 'Aprobada Auditoría',
      descripcion: 'Nómina quincenal personal administrativo'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-131',
      proveedor: 'Servicios de Investigación SAS',
      valorTotal: 95400000,
      fechaAsignacion: '2026-03-25',
      diasTranscurridos: 3,
      diasMaximos: 2,
      nivelRiesgo: 'vencido' as const,
      etapaActual: 'Cargue Formal',
      areaSolicitante: 'Investigación',
      observaciones: '¡URGENTE! Cargue vencido - Proyecto de investigación',
      fechaFactura: '2026-03-18',
      fechaRecepcion: '2026-03-25',
      estado: 'Aprobada Auditoría',
      descripcion: 'Equipos para proyecto de investigación científica'
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-153',
      proveedor: 'Tecnología Empresarial Cloud',
      valorTotal: 48200000,
      fechaAsignacion: '2026-03-31',
      diasTranscurridos: 0,
      diasMaximos: 2,
      nivelRiesgo: 'verde' as const,
      etapaActual: 'Cargue Formal',
      areaSolicitante: 'Sistemas',
      fechaFactura: '2026-03-29',
      fechaRecepcion: '2026-03-31',
      estado: 'Aprobada Auditoría',
      descripcion: 'Infraestructura cloud institucional'
    },
    {
      id: '5',
      numeroFactura: 'FAC-2026-140',
      proveedor: 'Editorial Científica Internacional',
      valorTotal: 32800000,
      fechaAsignacion: '2026-03-28',
      diasTranscurridos: 2,
      diasMaximos: 2,
      nivelRiesgo: 'naranja' as const,
      etapaActual: 'Cargue Formal',
      areaSolicitante: 'Biblioteca',
      observaciones: 'Suscripción bases de datos - Vence mañana',
      fechaFactura: '2026-03-24',
      fechaRecepcion: '2026-03-28',
      estado: 'Aprobada Auditoría',
      descripcion: 'Bases de datos científicas anuales'
    }
  ];

  const handleVerDetalle = (factura: any) => {
    setFacturaSeleccionada({
      ...factura,
      numeroRadicado: 'RAD-' + factura.numeroFactura,
      numeroProcesoPago: 'PP-' + factura.numeroFactura
    });
    setMostrarDetalle(true);
  };

  return (
    <>
      <div className="p-8">
        <MisPendientesSLA
          facturasPendientes={facturasPendientes}
          onVerDetalle={handleVerDetalle}
          nombreUsuario="Patricia Hernández Castro"
          rolUsuario="Dirección Financiera"
        />
      </div>

      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDetalle}
        onClose={() => {
          setMostrarDetalle(false);
          setFacturaSeleccionada(null);
        }}
      />
    </>
  );
}