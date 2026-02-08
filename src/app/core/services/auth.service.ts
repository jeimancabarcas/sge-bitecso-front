import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';
import { AuthResponse, User } from '../models/user.model';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { API_CONFIG } from '../config/api.config';

interface JwtPayload {
    username: string;
    fullName: string; // Added field
    sub: string;
    role: string;
    exp: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private apiUrl = API_CONFIG.baseUrl; // Base URL from config
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    // State Signals
    private currentUserSignal = signal<User | null>(this.getUserFromStorage());
    public currentUser = computed(() => this.currentUserSignal());
    public isAuthenticated = computed(() => {
        const user = this.currentUserSignal();
        return !!user && !this.isTokenExpired();
    });
    public isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');

    constructor() {
        if (this.isTokenExpired()) {
            this.logout();
        }
    }

    login(username: string, password: string): Observable<AuthResponse> {
        return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
            map(response => {
                const token = response.access_token;
                const decoded = jwtDecode<JwtPayload>(token);

                const user: User = {
                    id: decoded.sub,
                    cedula: decoded.username,
                    username: decoded.username,
                    fullName: decoded.fullName || decoded.username,
                    nombre: decoded.fullName || decoded.username,
                    role: decoded.role as 'admin' | 'digitador'
                };

                const authResponse: AuthResponse = {
                    token: token,
                    user: user
                };

                this.saveSession(authResponse);
                return authResponse;
            })
        );
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isTokenExpired(): boolean {
        const token = this.getToken();
        if (!token) return true;

        try {
            const decoded = jwtDecode<JwtPayload>(token);
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    private saveSession(response: AuthResponse) {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this.currentUserSignal.set(response.user);
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }
}
