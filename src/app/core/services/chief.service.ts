import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chief, CreateChiefDto, UpdateChiefDto } from '../models/chief.model';
import { API_CONFIG } from '../config/api.config';

export interface ChiefStats {
    id: string;
    nombre: string;
    cedula: string;
    totalLeaders?: number | string;
    totalVoters?: number | string;
    totalleaders?: number | string;
    totalvoters?: number | string;
}


@Injectable({
    providedIn: 'root'
})
export class ChiefService {
    private http = inject(HttpClient);
    private apiUrl = `${API_CONFIG.baseUrl}/chiefs`;

    findAll(): Observable<Chief[]> {
        return this.http.get<Chief[]>(this.apiUrl);
    }

    findOne(id: string): Observable<Chief> {
        return this.http.get<Chief>(`${this.apiUrl}/${id}`);
    }

    create(chief: CreateChiefDto): Observable<Chief> {
        return this.http.post<Chief>(this.apiUrl, chief);
    }

    update(id: string, chief: UpdateChiefDto): Observable<Chief> {
        return this.http.patch<Chief>(`${this.apiUrl}/${id}`, chief);
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getStats(): Observable<{ success: boolean; data: ChiefStats[] }> {
        return this.http.get<{ success: boolean; data: ChiefStats[] }>(`${this.apiUrl}/stats`);
    }
}
