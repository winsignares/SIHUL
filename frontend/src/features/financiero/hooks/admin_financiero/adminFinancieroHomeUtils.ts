

export interface AdminFinancieroHomeProps {
  onNavigate: (menu: string) => void;
}

export const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const ACTIVITIES_PER_PAGE = 4;
