import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leader, CreateLeaderDto, UpdateLeaderDto } from '../models/leader.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
    providedIn: 'root'
})
export class LeaderService {
    private http = inject(HttpClient);
    private apiUrl = `${API_CONFIG.baseUrl}/leaders`; // Using central config

    findAll(): Observable<Leader[]> {
        return this.http.get<Leader[]>(this.apiUrl);
    }

    findOne(id: string): Observable<Leader> {
        return this.http.get<Leader>(`${this.apiUrl}/${id}`);
    }

    create(leader: CreateLeaderDto): Observable<Leader> {
        return this.http.post<Leader>(this.apiUrl, leader);
    }

    update(id: string, leader: UpdateLeaderDto): Observable<Leader> {
        return this.http.patch<Leader>(`${this.apiUrl}/${id}`, leader);
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
