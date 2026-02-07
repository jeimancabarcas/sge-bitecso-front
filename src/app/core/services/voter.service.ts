import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export interface Leader {
    id: string;
    nombre: string;
    telefono: string;
    created_at?: string;
    updated_at?: string;
}

export interface Voter {
    id?: string;
    cedula: string;
    nombre: string;
    telefono: string;
    leader_id: string;
    leader?: Leader; // Verification status and leader details
    verification_status?: 'PENDING' | 'ERROR' | 'FAILED' | 'SUCCESS';
    registraduria_data?: any;
    created_at?: string;
    updated_at?: string;
    mesa?: number; // Optional now
    digitador?: string;
    fechaRegistro?: Date;
}

export interface VoterResponse {
    items: Voter[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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
    private apiUrl = 'http://localhost:3000'; // Base API URL

    getStats(): Observable<DashboardStats> {
        // Keeping mock for stats as endpoint wasn't provided yet
        return theMockStats();
    }

    getLeaders(): Observable<Leader[]> {
        return this.http.get<Leader[]>(`${this.apiUrl}/leaders`);
    }

    registerVoter(voter: Partial<Voter>): Observable<any> {
        return this.http.post(`${this.apiUrl}/voters`, voter);
    }

    getMyRecords(page: number = 1, limit: number = 10): Observable<VoterResponse> {
        return this.http.get<VoterResponse>(`${this.apiUrl}/voters/my-records`, {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }
}

function theMockStats(): Observable<DashboardStats> {
    return of({
        totalRegistered: 12543,
        byMesa: [
            { mesa: 1, count: 450 },
            { mesa: 2, count: 320 },
            { mesa: 3, count: 510 },
            { mesa: 4, count: 120 },
        ],
        recentActivity: []
    }).pipe(delay(500));
}
