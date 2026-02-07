import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        // User is already logged in, redirect based on role
        const role = authService.currentUser()?.role;
        if (role === 'admin') {
            router.navigate(['/admin/dashboard']);
        } else {
            router.navigate(['/digitador/register']);
        }
        return false;
    }

    return true;
};
