import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  cuentaBancaria: string;
}

export interface DocumentoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  url?: string;
}

export interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado?: string;
  numeroProcesoPago?: string;
  numeroTransaccion?: string;
  numeroComprobante?: string;
  proveedor: string;
  nit: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion: string;
  fechaRadicacion?: string;
  fechaCausacion?: string;
  fechaAlistamiento?: string;
  fechaAprobacionAuditoria?: string;
  fechaCargue?: string;
  fechaAutorizacion?: string;
  fechaPagoAplicado?: string;
  fechaComprobante?: string;
  areaSolicitante: string;
  tipoDocumento: string;
  descripcion: string;
  observaciones: string;
  cuentaContable?: string;
  centroCosto?: string;
  cuentaBancaria?: string;
  estado: 'Recibida' | 'Radicada' | 'Causada' | 'Alistada' | 'Aprobada Auditoría' | 'Rechazada Auditoría' | 'Cargada' | 'Autorizada' | 'Rechazada' | 'Pago Aplicado' | 'Pagada' | 'Devuelta' | 'Detenida';
  etapaActual: string;
  diasTranscurridos: number;
  indicadorRiesgo: 'ok' | 'atencion' | 'atrasada' | 'vencida';
  documentosAdjuntos: DocumentoAdjunto[];
  historial: {
    fecha: string;
    accion: string;
    responsable: string;
    observacion?: string;
  }[];
}

interface FacturasContextType {
  facturas: Factura[];
  proveedores: Proveedor[];
  agregarFactura: (factura: Factura) => void;
  actualizarFactura: (id: string, datos: Partial<Factura>) => void;
  obtenerFacturasPorEstado: (estado: string) => Factura[];
  agregarProveedor: (proveedor: Proveedor) => void;
}

const FacturasContext = createContext<FacturasContextType | undefined>(undefined);

export function FacturasProvider({ children }: { children: ReactNode }) {
  // Proveedores existentes
  const [proveedores, setProveedores] = useState<Proveedor[]>([
    {
      id: 'P001',
      nombre: 'Tecnología Global SAS',
      nit: '900123456-7',
      cuentaBancaria: '1234567890 - Banco Popular'
    },
    {
      id: 'P002',
      nombre: 'Servicios Médicos Especializados',
      nit: '900234567-8',
      cuentaBancaria: '9876543210 - Bancolombia'
    },
    {
      id: 'P003',
      nombre: 'Editorial Académica Colombia',
      nit: '900345678-9',
      cuentaBancaria: '5555666677 - Davivienda'
    },
    {
      id: 'P004',
      nombre: 'Mantenimiento y Obras SAS',
      nit: '900456789-0',
      cuentaBancaria: '8888999900 - Banco de Bogotá'
    },
    {
      id: 'P005',
      nombre: 'Papelería y Suministros Ltda',
      nit: '900567890-1',
      cuentaBancaria: '1111222233 - BBVA'
    }
  ]);

  // Facturas iniciales (incluye ejemplos de devueltas/rechazadas)
  const [facturas, setFacturas] = useState<Factura[]>([
    // 1. RECIBIDA
    {
      id: 'F001',
      numeroFactura: 'FAC-2026-150',
      proveedor: 'Editorial Académica Colombia',
      nit: '900345678-9',
      valorTotal: 3200000,
      fechaFactura: '2026-04-01',
      fechaRecepcion: '2026-04-02',
      areaSolicitante: 'Biblioteca',
      tipoDocumento: 'Factura Electrónica',
      descripcion: 'Suscripción anual a bases de datos académicas',
      observaciones: '',
      estado: 'Recibida',
      etapaActual: 'Radicación Contable',
      diasTranscurridos: 1,
      indicadorRiesgo: 'ok',
      documentosAdjuntos: [
        { id: 'D001', nombre: 'factura_150.pdf', tipo: 'application/pdf', tamano: 245000 }
      ],
      historial: [
        {
          fecha: '2026-04-02',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Biblioteca',
          observacion: 'Factura registrada en el sistema'
        }
      ]
    },
    // 2. RADICADA
    {
      id: 'F002',
      numeroFactura: 'FAC-2026-145',
      numeroRadicado: 'RAD-2026-00145',
      proveedor: 'Tecnología Global SAS',
      nit: '900123456-7',
      valorTotal: 8900000,
      fechaFactura: '2026-03-25',
      fechaRecepcion: '2026-03-28',
      fechaRadicacion: '2026-03-29',
      areaSolicitante: 'Sistemas',
      tipoDocumento: 'Factura Electrónica',
      descripcion: 'Equipos de cómputo para área administrativa',
      observaciones: '',
      estado: 'Radicada',
      etapaActual: 'Causación Contable',
      diasTranscurridos: 4,
      indicadorRiesgo: 'ok',
      documentosAdjuntos: [
        { id: 'D002', nombre: 'factura_145.pdf', tipo: 'application/pdf', tamano: 245000 },
        { id: 'D003', nombre: 'orden_compra.pdf', tipo: 'application/pdf', tamano: 120000 }
      ],
      historial: [
        {
          fecha: '2026-03-28',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Sistemas',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-03-29',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00145'
        }
      ]
    },
    // 3. CAUSADA
    {
      id: 'F003',
      numeroFactura: 'FAC-2026-142',
      numeroRadicado: 'RAD-2026-00142',
      proveedor: 'Mantenimiento y Obras SAS',
      nit: '900456789-0',
      valorTotal: 5600000,
      fechaFactura: '2026-03-20',
      fechaRecepcion: '2026-03-22',
      fechaRadicacion: '2026-03-23',
      fechaCausacion: '2026-03-25',
      areaSolicitante: 'Mantenimiento',
      tipoDocumento: 'Factura',
      descripcion: 'Reparación de aires acondicionados - Edificio A',
      observaciones: '',
      cuentaContable: '5105-01',
      centroCosto: 'CC-MANT-001',
      estado: 'Causada',
      etapaActual: 'Alistamiento de Pago',
      diasTranscurridos: 11,
      indicadorRiesgo: 'ok',
      documentosAdjuntos: [
        { id: 'D004', nombre: 'factura_142.pdf', tipo: 'application/pdf', tamano: 180000 }
      ],
      historial: [
        {
          fecha: '2026-03-22',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Mantenimiento',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-03-23',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00142'
        },
        {
          fecha: '2026-03-25',
          accion: 'Factura Causada',
          responsable: 'Contabilidad',
          observacion: 'Causación contable registrada'
        }
      ]
    },
    // 4. ALISTADA
    {
      id: 'F004',
      numeroFactura: 'FAC-2026-138',
      numeroRadicado: 'RAD-2026-00138',
      numeroProcesoPago: 'PP-2026-0089',
      proveedor: 'Papelería y Suministros Ltda',
      nit: '900567890-1',
      valorTotal: 2450000,
      fechaFactura: '2026-03-15',
      fechaRecepcion: '2026-03-18',
      fechaRadicacion: '2026-03-19',
      fechaCausacion: '2026-03-20',
      fechaAlistamiento: '2026-03-22',
      areaSolicitante: 'Administración',
      tipoDocumento: 'Factura',
      descripcion: 'Suministros de oficina - Marzo 2026',
      observaciones: '',
      cuentaContable: '5120-02',
      centroCosto: 'CC-ADM-001',
      cuentaBancaria: '1111222233 - BBVA',
      estado: 'Alistada',
      etapaActual: 'Control Previo Auditoría',
      diasTranscurridos: 15,
      indicadorRiesgo: 'atencion',
      documentosAdjuntos: [
        { id: 'D005', nombre: 'factura_138.pdf', tipo: 'application/pdf', tamano: 180000 }
      ],
      historial: [
        {
          fecha: '2026-03-18',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Administración',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-03-19',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00138'
        },
        {
          fecha: '2026-03-20',
          accion: 'Factura Causada',
          responsable: 'Contabilidad',
          observacion: 'Causación contable registrada'
        },
        {
          fecha: '2026-03-22',
          accion: 'Factura Alistada',
          responsable: 'Tesorería',
          observacion: 'Proceso de pago creado: PP-2026-0089'
        }
      ]
    },
    // 5. APROBADA AUDITORÍA
    {
      id: 'F005',
      numeroFactura: 'FAC-2026-135',
      numeroRadicado: 'RAD-2026-00135',
      numeroProcesoPago: 'PP-2026-0085',
      proveedor: 'Servicios Médicos Especializados',
      nit: '900234567-8',
      valorTotal: 14800000,
      fechaFactura: '2026-03-10',
      fechaRecepcion: '2026-03-12',
      fechaRadicacion: '2026-03-13',
      fechaCausacion: '2026-03-14',
      fechaAlistamiento: '2026-03-16',
      fechaAprobacionAuditoria: '2026-03-18',
      areaSolicitante: 'Enfermería',
      tipoDocumento: 'Factura Electrónica',
      descripcion: 'Servicios médicos especializados - Marzo',
      observaciones: '',
      cuentaContable: '5115-03',
      centroCosto: 'CC-ENF-001',
      cuentaBancaria: '9876543210 - Bancolombia',
      estado: 'Aprobada Auditoría',
      etapaActual: 'Cargue a Plataforma Bancaria',
      diasTranscurridos: 21,
      indicadorRiesgo: 'atrasada',
      documentosAdjuntos: [
        { id: 'D006', nombre: 'factura_135.pdf', tipo: 'application/pdf', tamano: 320000 },
        { id: 'D007', nombre: 'contrato.pdf', tipo: 'application/pdf', tamano: 450000 }
      ],
      historial: [
        {
          fecha: '2026-03-12',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Enfermería',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-03-13',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00135'
        },
        {
          fecha: '2026-03-14',
          accion: 'Factura Causada',
          responsable: 'Contabilidad',
          observacion: 'Causación contable registrada'
        },
        {
          fecha: '2026-03-16',
          accion: 'Factura Alistada',
          responsable: 'Tesorería',
          observacion: 'Proceso de pago creado: PP-2026-0085'
        },
        {
          fecha: '2026-03-18',
          accion: 'Aprobada por Auditoría',
          responsable: 'Auditoría',
          observacion: 'Documentación verificada y aprobada'
        }
      ]
    },
    // 6. CARGADA
    {
      id: 'F006',
      numeroFactura: 'FAC-2026-130',
      numeroRadicado: 'RAD-2026-00130',
      numeroProcesoPago: 'PP-2026-0078',
      numeroTransaccion: 'TRX-2026-0045',
      proveedor: 'Tecnología Global SAS',
      nit: '900123456-7',
      valorTotal: 12500000,
      fechaFactura: '2026-03-05',
      fechaRecepcion: '2026-03-07',
      fechaRadicacion: '2026-03-08',
      fechaCausacion: '2026-03-09',
      fechaAlistamiento: '2026-03-11',
      fechaAprobacionAuditoria: '2026-03-12',
      fechaCargue: '2026-03-14',
      areaSolicitante: 'Sistemas',
      tipoDocumento: 'Factura Electrónica',
      descripcion: 'Licencias de software institucional',
      observaciones: '',
      cuentaContable: '5140-01',
      centroCosto: 'CC-SIS-001',
      cuentaBancaria: '1234567890 - Banco Popular',
      estado: 'Cargada',
      etapaActual: 'Autorización de Pago',
      diasTranscurridos: 26,
      indicadorRiesgo: 'atrasada',
      documentosAdjuntos: [
        { id: 'D008', nombre: 'factura_130.pdf', tipo: 'application/pdf', tamano: 280000 }
      ],
      historial: [
        {
          fecha: '2026-03-07',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Sistemas',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-03-08',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00130'
        },
        {
          fecha: '2026-03-09',
          accion: 'Factura Causada',
          responsable: 'Contabilidad',
          observacion: 'Causación contable registrada'
        },
        {
          fecha: '2026-03-11',
          accion: 'Factura Alistada',
          responsable: 'Tesorería',
          observacion: 'Proceso de pago creado: PP-2026-0078'
        },
        {
          fecha: '2026-03-12',
          accion: 'Aprobada por Auditoría',
          responsable: 'Auditoría',
          observacion: 'Documentación verificada y aprobada'
        },
        {
          fecha: '2026-03-14',
          accion: 'Cargada a Plataforma',
          responsable: 'Tesorería',
          observacion: 'Transacción: TRX-2026-0045'
        }
      ]
    },
    // 7. AUTORIZADA
    {
      id: 'F007',
      numeroFactura: 'FAC-2026-125',
      numeroRadicado: 'RAD-2026-00125',
      numeroProcesoPago: 'PP-2026-0070',
      numeroTransaccion: 'TRX-2026-0038',
      proveedor: 'Editorial Académica Colombia',
      nit: '900345678-9',
      valorTotal: 6800000,
      fechaFactura: '2026-02-28',
      fechaRecepcion: '2026-03-02',
      fechaRadicacion: '2026-03-03',
      fechaCausacion: '2026-03-04',
      fechaAlistamiento: '2026-03-06',
      fechaAprobacionAuditoria: '2026-03-07',
      fechaCargue: '2026-03-09',
      fechaAutorizacion: '2026-03-11',
      areaSolicitante: 'Biblioteca',
      tipoDocumento: 'Factura',
      descripcion: 'Adquisición de libros especializados',
      observaciones: '',
      cuentaContable: '5125-02',
      centroCosto: 'CC-BIB-001',
      cuentaBancaria: '5555666677 - Davivienda',
      estado: 'Autorizada',
      etapaActual: 'Aplicación de Pago',
      diasTranscurridos: 31,
      indicadorRiesgo: 'vencida',
      documentosAdjuntos: [
        { id: 'D009', nombre: 'factura_125.pdf', tipo: 'application/pdf', tamano: 220000 }
      ],
      historial: [
        {
          fecha: '2026-03-02',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Biblioteca',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-03-03',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00125'
        },
        {
          fecha: '2026-03-04',
          accion: 'Factura Causada',
          responsable: 'Contabilidad',
          observacion: 'Causación contable registrada'
        },
        {
          fecha: '2026-03-06',
          accion: 'Factura Alistada',
          responsable: 'Tesorería',
          observacion: 'Proceso de pago creado: PP-2026-0070'
        },
        {
          fecha: '2026-03-07',
          accion: 'Aprobada por Auditoría',
          responsable: 'Auditoría',
          observacion: 'Documentación verificada y aprobada'
        },
        {
          fecha: '2026-03-09',
          accion: 'Cargada a Plataforma',
          responsable: 'Tesorería',
          observacion: 'Transacción: TRX-2026-0038'
        },
        {
          fecha: '2026-03-11',
          accion: 'Pago Autorizado',
          responsable: 'Dirección Financiera',
          observacion: 'Autorización otorgada para desembolso'
        }
      ]
    },
    // 8. PAGO APLICADO
    {
      id: 'F008',
      numeroFactura: 'FAC-2026-120',
      numeroRadicado: 'RAD-2026-00120',
      numeroProcesoPago: 'PP-2026-0065',
      numeroTransaccion: 'TRX-2026-0032',
      proveedor: 'Mantenimiento y Obras SAS',
      nit: '900456789-0',
      valorTotal: 9200000,
      fechaFactura: '2026-02-25',
      fechaRecepcion: '2026-02-27',
      fechaRadicacion: '2026-02-28',
      fechaCausacion: '2026-03-01',
      fechaAlistamiento: '2026-03-03',
      fechaAprobacionAuditoria: '2026-03-04',
      fechaCargue: '2026-03-06',
      fechaAutorizacion: '2026-03-08',
      fechaPagoAplicado: '2026-03-10',
      areaSolicitante: 'Infraestructura',
      tipoDocumento: 'Factura Electrónica',
      descripcion: 'Mantenimiento preventivo instalaciones eléctricas',
      observaciones: '',
      cuentaContable: '5110-04',
      centroCosto: 'CC-INF-001',
      cuentaBancaria: '8888999900 - Banco de Bogotá',
      estado: 'Pago Aplicado',
      etapaActual: 'Generación de Comprobante',
      diasTranscurridos: 36,
      indicadorRiesgo: 'vencida',
      documentosAdjuntos: [
        { id: 'D010', nombre: 'factura_120.pdf', tipo: 'application/pdf', tamano: 290000 }
      ],
      historial: [
        {
          fecha: '2026-02-27',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Infraestructura',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-02-28',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00120'
        },
        {
          fecha: '2026-03-01',
          accion: 'Factura Causada',
          responsable: 'Contabilidad',
          observacion: 'Causación contable registrada'
        },
        {
          fecha: '2026-03-03',
          accion: 'Factura Alistada',
          responsable: 'Tesorería',
          observacion: 'Proceso de pago creado: PP-2026-0065'
        },
        {
          fecha: '2026-03-04',
          accion: 'Aprobada por Auditoría',
          responsable: 'Auditoría',
          observacion: 'Documentación verificada y aprobada'
        },
        {
          fecha: '2026-03-06',
          accion: 'Cargada a Plataforma',
          responsable: 'Tesorería',
          observacion: 'Transacción: TRX-2026-0032'
        },
        {
          fecha: '2026-03-08',
          accion: 'Pago Autorizado',
          responsable: 'Dirección Financiera',
          observacion: 'Autorización otorgada para desembolso'
        },
        {
          fecha: '2026-03-10',
          accion: 'Pago Aplicado',
          responsable: 'Tesorería',
          observacion: 'Desembolso ejecutado exitosamente'
        }
      ]
    },
    // 9. PAGADA
    {
      id: 'F009',
      numeroFactura: 'FAC-2026-115',
      numeroRadicado: 'RAD-2026-00115',
      numeroProcesoPago: 'PP-2026-0058',
      numeroTransaccion: 'TRX-2026-0025',
      numeroComprobante: 'CE-2026-0018',
      proveedor: 'Papelería y Suministros Ltda',
      nit: '900567890-1',
      valorTotal: 1850000,
      fechaFactura: '2026-02-20',
      fechaRecepcion: '2026-02-22',
      fechaRadicacion: '2026-02-23',
      fechaCausacion: '2026-02-24',
      fechaAlistamiento: '2026-02-26',
      fechaAprobacionAuditoria: '2026-02-27',
      fechaCargue: '2026-02-29',
      fechaAutorizacion: '2026-03-02',
      fechaPagoAplicado: '2026-03-04',
      fechaComprobante: '2026-03-05',
      areaSolicitante: 'Administración',
      tipoDocumento: 'Factura',
      descripcion: 'Material de aseo y limpieza',
      observaciones: '',
      cuentaContable: '5130-01',
      centroCosto: 'CC-ADM-002',
      cuentaBancaria: '1111222233 - BBVA',
      estado: 'Pagada',
      etapaActual: 'Finalizado',
      diasTranscurridos: 41,
      indicadorRiesgo: 'ok',
      documentosAdjuntos: [
        { id: 'D011', nombre: 'factura_115.pdf', tipo: 'application/pdf', tamano: 160000 }
      ],
      historial: [
        {
          fecha: '2026-02-22',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Administración',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-02-23',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00115'
        },
        {
          fecha: '2026-02-24',
          accion: 'Factura Causada',
          responsable: 'Contabilidad',
          observacion: 'Causación contable registrada'
        },
        {
          fecha: '2026-02-26',
          accion: 'Factura Alistada',
          responsable: 'Tesorería',
          observacion: 'Proceso de pago creado: PP-2026-0058'
        },
        {
          fecha: '2026-02-27',
          accion: 'Aprobada por Auditoría',
          responsable: 'Auditoría',
          observacion: 'Documentación verificada y aprobada'
        },
        {
          fecha: '2026-02-29',
          accion: 'Cargada a Plataforma',
          responsable: 'Tesorería',
          observacion: 'Transacción: TRX-2026-0025'
        },
        {
          fecha: '2026-03-02',
          accion: 'Pago Autorizado',
          responsable: 'Dirección Financiera',
          observacion: 'Autorización otorgada para desembolso'
        },
        {
          fecha: '2026-03-04',
          accion: 'Pago Aplicado',
          responsable: 'Tesorería',
          observacion: 'Desembolso ejecutado exitosamente'
        },
        {
          fecha: '2026-03-05',
          accion: 'Comprobante Generado',
          responsable: 'Tesorería',
          observacion: 'Comprobante de egreso: CE-2026-0018'
        }
      ]
    },
    // 10. DEVUELTA
    {
      id: 'F010',
      numeroFactura: 'FAC-2026-129',
      proveedor: 'Servicios Médicos Especializados',
      nit: '900234567-8',
      valorTotal: 15600000,
      fechaFactura: '2026-03-15',
      fechaRecepcion: '2026-03-20',
      areaSolicitante: 'Enfermería',
      tipoDocumento: 'Factura Electrónica',
      descripcion: 'Servicios médicos especializados - Febrero',
      observaciones: 'El valor de la factura no coincide con el contrato. Verificar montos.',
      estado: 'Devuelta',
      etapaActual: 'Registro (Corrección)',
      diasTranscurridos: 13,
      indicadorRiesgo: 'atrasada',
      documentosAdjuntos: [
        { id: 'D012', nombre: 'factura_129.pdf', tipo: 'application/pdf', tamano: 320000 },
        { id: 'D013', nombre: 'contrato.pdf', tipo: 'application/pdf', tamano: 450000 }
      ],
      historial: [
        {
          fecha: '2026-03-20',
          accion: 'Factura Recibida',
          responsable: 'Funcionario - Enfermería',
          observacion: 'Factura registrada en el sistema'
        },
        {
          fecha: '2026-03-21',
          accion: 'Factura Radicada',
          responsable: 'Contabilidad',
          observacion: 'Radicado generado: RAD-2026-00129'
        },
        {
          fecha: '2026-03-22',
          accion: 'Devuelta en Causación',
          responsable: 'Contabilidad',
          observacion: 'El valor de la factura ($15,600,000) no coincide con el valor del contrato ($14,800,000). Verificar y corregir.'
        }
      ]
    }
  ]);

  const agregarFactura = (factura: Factura) => {
    setFacturas(prev => [...prev, factura]);
  };

  const actualizarFactura = (id: string, datos: Partial<Factura>) => {
    setFacturas(prev =>
      prev.map(f => (f.id === id ? { ...f, ...datos } : f))
    );
  };

  const obtenerFacturasPorEstado = (estado: string) => {
    return facturas.filter(f => f.estado === estado);
  };

  const agregarProveedor = (proveedor: Proveedor) => {
    setProveedores(prev => [...prev, proveedor]);
  };

  return (
    <FacturasContext.Provider
      value={{
        facturas,
        proveedores,
        agregarFactura,
        actualizarFactura,
        obtenerFacturasPorEstado,
        agregarProveedor
      }}
    >
      {children}
    </FacturasContext.Provider>
  );
}

export function useFacturas() {
  const context = useContext(FacturasContext);
  if (context === undefined) {
    throw new Error('useFacturas must be used within a FacturasProvider');
  }
  return context;
}