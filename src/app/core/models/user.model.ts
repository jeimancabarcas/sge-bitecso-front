export interface User {
    id: number | string;
    cedula?: string;
    username: string;
    role: 'admin' | 'digitador';
    nombre?: string;
    fullName?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateUserDto {
    username: string;
    fullName: string;
    password?: string;
    role?: 'admin' | 'digitador';
}

export interface UpdateUserDto {
    username?: string;
    fullName?: string;
    password?: string;
    role?: 'admin' | 'digitador';
}

export interface AuthResponse {
    token: string;
    user: User;
}
