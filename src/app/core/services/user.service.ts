import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/users';

    findAll(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/digitators`);
    }

    create(user: CreateUserDto): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    // Assuming backend supports PATCH/DELETE similarly to Leaders
    update(id: string, user: UpdateUserDto): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${id}`, user);
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
