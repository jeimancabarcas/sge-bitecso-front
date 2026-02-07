import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export interface Voter {
    id: number;
    cedula: string;
    nombre: string;
    telefono: string;
    mesa: number;
    digitador: string;
    fechaRegistro: Date;
}

export interface DashboardStats {
    totalRegistered: number;
    byMesa: { mesa: number; count: number }[];
    recentActivity: Voter[];
}

@Injectable({
    providedIn: 'root'
})
export class VoterService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/api/voters';

    // Mock data for MVP since backend might not be ready
    private mockVoters: Voter[] = [
        { id: 1, cedula: '1234567890', nombre: 'Juan Perez', telefono: '3001234567', mesa: 1, digitador: 'user1', fechaRegistro: new Date() },
        { id: 2, cedula: '0987654321', nombre: 'Maria Gomez', telefono: '3109876543', mesa: 2, digitador: 'user2', fechaRegistro: new Date() },
        { id: 3, cedula: '1122334455', nombre: 'Carlos Ruiz', telefono: '3201122334', mesa: 1, digitador: 'user1', fechaRegistro: new Date() },
    ];

    getStats(): Observable<DashboardStats> {
        // return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);

        // Mock Implementation
        return of({
            totalRegistered: 12543,
            byMesa: [
                { mesa: 1, count: 450 },
                { mesa: 2, count: 320 },
                { mesa: 3, count: 510 },
                { mesa: 4, count: 120 },
            ],
            recentActivity: this.mockVoters
        }).pipe(delay(500));
    }

    registerVoter(voter: Partial<Voter>): Observable<any> {
        // return this.http.post(this.apiUrl, voter);
        return of({ success: true }).pipe(delay(800));
    }
}
