import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

import { Leader } from '../models/leader.model';
import { API_CONFIG } from '../config/api.config';

// export interface Leader { ... } - Removed duplicate

export interface VerificationLog {
    status: string;
    message: string;
    attempted_at: string;
}

export interface VoterDetail {
    id: string;
    department: string;
    municipality: string;
    polling_station: string;
    table: string;
    address: string;
}

export interface Voter {
    id?: string;
    cedula: string;
    nombre: string;
    telefono: string;
    leader_id: string;
    leader?: Leader;
    verification_status?: 'PENDING' | 'ERROR' | 'FAILED' | 'SUCCESS';
    registraduria_data?: any;
    created_at?: string;
    updated_at?: string;
    mesa?: number;
    detail?: VoterDetail; // New detail property
    digitador?: string;
    created_by?: {
        id: string;
        username: string;
        role: string;
    };
    verification_logs?: VerificationLog[];
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

export interface RealDashboardStats { // New interface based on user request
    total: number;
    success: number;
    failed: number;
    error: number;
    pending: number;
}

export interface DigitadorStats {
    id: string;
    username: string;
    total: number;
    success: number;
    failed: number;
    error: number;
    pending: number;
}

export interface LeaderStats {
    id: string;
    name: string;
    total: number;
    success: number;
    failed: number;
    error: number;
    pending: number;
}

@Injectable({
    providedIn: 'root'
})
export class VoterService {
    private http = inject(HttpClient);
    private apiUrl = API_CONFIG.baseUrl; // Base API URL from config

    getStats(): Observable<DashboardStats> {
        // Keeping mock for stats as endpoint wasn't provided yet
        return theMockStats();
    }

    getDashboardStats(): Observable<RealDashboardStats> {
        return this.http.get<RealDashboardStats>(`${this.apiUrl}/voters/dashboard-stats`);
    }

    getDigitatorsStats(): Observable<DigitadorStats[]> {
        return this.http.get<DigitadorStats[]>(`${this.apiUrl}/voters/digitators-stats`);
    }

    getLeadersStats(): Observable<LeaderStats[]> {
        return this.http.get<LeaderStats[]>(`${this.apiUrl}/voters/leaders-stats`);
    }

    getReport(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/voters/report`, { responseType: 'blob' });
    }

    getReportByLeader(leaderId?: string): Observable<Blob> {
        const url = leaderId ? `${this.apiUrl}/voters/report-by-leader?leaderId=${leaderId}` : `${this.apiUrl}/voters/report-by-leader`;
        return this.http.get(url, { responseType: 'blob' });
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

    getVoters(page: number = 1, limit: number = 10): Observable<VoterResponse> {
        return this.http.get<VoterResponse>(`${this.apiUrl}/voters`, {
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
