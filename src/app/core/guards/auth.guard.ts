import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        const userRole = authService.currentUser()?.role;
        const expectedRole = route.data['role'];

        if (expectedRole && userRole !== expectedRole) {
            router.navigate(['/']);
            return false;
        }
        return true;
    }

    // Not authenticated
    router.navigate(['/login']);
    return false;
};
