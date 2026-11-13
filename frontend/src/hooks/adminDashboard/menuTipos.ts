export interface MenuItem {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    label: string;
    route: string;
    code: string;
}

export interface MenuSection {
    id: string;
    label: string;
    items: MenuItem[];
}
