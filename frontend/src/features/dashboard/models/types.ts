import type { LucideIcon } from 'lucide-react';

export interface DashboardStat {
    label: string;
    value: string | number;
    change?: string;
    icon: LucideIcon;
    gradient?: string;
    bgGradient?: string;
    iconBg?: string;
    changePositive?: boolean;
    textColor?: string;
    bgColor?: string;
    color?: string;
    trend?: string;
    trendUp?: boolean;
}

export interface Activity {
    id?: string;
    title: string;
    description: string;
    time: string;
    status?: 'pending' | 'completed' | 'approved' | 'rechazado';
    icon: LucideIcon;
    color?: string;
    date?: string;
    solicitante?: string;
    espacio?: string;
    hora?: string;
    fecha?: string;
    estado?: string;
    accion?: string;
    tipo?: string;
}

export interface QuickAction {
    title: string; // or label
    description?: string;
    icon: LucideIcon;
    action: string;
    color?: string; // gradient or solid
    iconBg?: string;
    iconColor?: string;
    label?: string; // alias for title
    trend?: string; // for stats used as actions
}

export interface UpcomingEvent {
    date: string;
    title: string;
    location?: string;
    time: string;
    type?: 'maintenance' | 'event' | 'approved';
    solicitante?: string;
    espacio?: string;
    hora?: string;
    fecha?: string;
}

export interface OccupancyData {
    day: string;
    dayShort?: string;
    percentage?: number;
    value?: number;
    classes?: number;
    espaciosOcupados?: number;
    totalEspacios?: number;
    prestamosActivos?: number;
    color?: string;
    isToday?: boolean;
    franjas?: {
        hora: string;
        ocupacion: number;
        espaciosUsados?: number;
        totalEspacios?: number;
        color: string;
    }[];
}
