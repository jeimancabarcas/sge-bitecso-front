import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
    standalone: true,
    template: ''
})
export class RoleRedirectComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);

    ngOnInit() {
        const user = this.authService.currentUser() as User | null;
        const role = user?.role;
        if (role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
        } else if (role === 'digitador') {
            this.router.navigate(['/digitador/register']);
        } else if (role === 'viewer') {
            this.router.navigate(['/viewer/dashboard']);
        } else {
            this.router.navigate(['/login']);
        }
    }
}
