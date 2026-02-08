export interface Chief {
    id: string;
    nombre: string;
    cedula: string;
    telefono?: string;
    leaders?: any[]; // Relationship with associated leaders
}

export interface CreateChiefDto {
    nombre: string;
    cedula: string;
    telefono?: string;
}

export interface UpdateChiefDto {
    nombre?: string;
    cedula?: string;
    telefono?: string;
}
