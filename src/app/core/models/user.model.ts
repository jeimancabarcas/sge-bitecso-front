export interface User {
    id: number | string;
    cedula: string;
    username: string;
    role: 'admin' | 'digitador';
    nombre: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
