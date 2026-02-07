import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leader, CreateLeaderDto, UpdateLeaderDto } from '../models/leader.model';

@Injectable({
    providedIn: 'root'
})
export class LeaderService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/leaders'; // Assuming base URL is localhost:3000

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
