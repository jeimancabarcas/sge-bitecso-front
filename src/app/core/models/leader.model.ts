export interface Leader {
    id: string;
    cedula: string;
    nombre: string;
    telefono: string;
    jefe?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateLeaderDto {
    cedula: string;
    nombre: string;
    telefono: string;
    jefe?: string;
}

export interface UpdateLeaderDto {
    cedula?: string;
    nombre?: string;
    telefono?: string;
    jefe?: string;
}
