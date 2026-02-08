import { Chief } from './chief.model';

export interface Leader {
    id: string;
    cedula: string;
    nombre: string;
    telefono: string;
    chief_id?: string;
    chief?: Chief;
    created_at?: string;
    updated_at?: string;
}

export interface CreateLeaderDto {
    cedula: string;
    nombre: string;
    telefono: string;
    chief_id: string;
}

export interface UpdateLeaderDto {
    cedula?: string;
    nombre?: string;
    telefono?: string;
    chief_id?: string;
}
