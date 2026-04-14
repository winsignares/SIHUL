import { useState } from 'react';
import MisPendientesSLA from '../ui/mis-pendientes-sla';
import FacturaDetailModal from '../ui/factura-detail-modal';

export default function MisPendientes() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const facturasPendientes = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-129',
      proveedor: 'Construcciones Universitarias SAS',
      valorTotal: 450000000,
      fechaAsignacion: '2026-03-26',
      diasTranscurridos: 3,
      diasMaximos: 3,
      nivelRiesgo: 'naranja' as const,
      etapaActual: 'Autorización de Pago',
      areaSolicitante: 'Infraestructura',
      observaciones: 'Obra Bloque D - 80% avance - Requiere autorización urgente',
      fechaFactura: '2026-03-15',
      fechaRecepcion: '2026-03-26',
      estado: 'Cargada para autorización',
      descripcion: 'Pago parcial construcción bloque D - Avance 80%'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-139',
      proveedor: 'Nómina Planta Docente',
      valorTotal: 825000000,
      fechaAsignacion: '2026-03-28',
      diasTranscurridos: 2,
      diasMaximos: 3,
      nivelRiesgo: 'amarillo' as const,
      etapaActual: 'Autorización de Pago',
      areaSolicitante: 'Talento Humano',
      observaciones: 'Nómina mensual docentes - Autorizar antes del 5 de abril',
      fechaFactura: '2026-03-25',
      fechaRecepcion: '2026-03-28',
      estado: 'Cargada para autorización',
      descripcion: 'Nómina planta docente mes de marzo 2026'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-122',
      proveedor: 'Consultoría Internacional Acreditación',
      valorTotal: 185000000,
      fechaAsignacion: '2026-03-24',
      diasTranscurridos: 4,
      diasMaximos: 3,
      nivelRiesgo: 'vencido' as const,
      etapaActual: 'Autorización de Pago',
      areaSolicitante: 'Vicerrectoría Académica',
      observaciones: '¡CRÍTICO! Pago vencido - Consultor solicitando autorización inmediata',
      fechaFactura: '2026-03-10',
      fechaRecepcion: '2026-03-24',
      estado: 'Cargada para autorización',
      descripcion: 'Consultoría proceso de acreditación internacional'
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-148',
      proveedor: 'Tecnología Educativa Global',
      valorTotal: 125000000,
      fechaAsignacion: '2026-03-30',
      diasTranscurridos: 1,
      diasMaximos: 3,
      nivelRiesgo: 'verde' as const,
      etapaActual: 'Autorización de Pago',
      areaSolicitante: 'Sistemas',
      observaciones: 'Plataforma académica - Todo en orden para autorización',
      fechaFactura: '2026-03-27',
      fechaRecepcion: '2026-03-30',
      estado: 'Cargada para autorización',
      descripcion: 'Licencia anual plataforma gestión académica'
    },
    {
      id: '5',
      numeroFactura: 'FAC-2026-154',
      proveedor: 'Equipamiento Científico Internacional',
      valorTotal: 285000000,
      fechaAsignacion: '2026-03-31',
      diasTranscurridos: 0,
      diasMaximos: 3,
      nivelRiesgo: 'verde' as const,
      etapaActual: 'Autorización de Pago',
      areaSolicitante: 'Investigación',
      fechaFactura: '2026-03-28',
      fechaRecepcion: '2026-03-31',
      estado: 'Cargada para autorización',
      descripcion: 'Equipos especializados laboratorios de investigación'
    },
    {
      id: '6',
      numeroFactura: 'FAC-2026-143',
      proveedor: 'Servicios Especializados Biblioteca',
      valorTotal: 68500000,
      fechaAsignacion: '2026-03-29',
      diasTranscurridos: 2,
      diasMaximos: 3,
      nivelRiesgo: 'amarillo' as const,
      etapaActual: 'Autorización de Pago',
      areaSolicitante: 'Biblioteca',
      observaciones: 'Renovación suscripciones - Vencimiento próximo',
      fechaFactura: '2026-03-26',
      fechaRecepcion: '2026-03-29',
      estado: 'Cargada para autorización',
      descripcion: 'Suscripciones revistas científicas indexadas'
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
          nombreUsuario="Dr. Ricardo Silva Montenegro"
          rolUsuario="Rectoría"
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