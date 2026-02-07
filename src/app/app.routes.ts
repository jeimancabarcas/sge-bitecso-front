import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { RoleRedirectComponent } from './shared/components/role-redirect.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [publicGuard]
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                component: RoleRedirectComponent,
                pathMatch: 'full'
            },
            {
                path: 'admin',
                canActivate: [authGuard],
                data: { role: 'admin' },
                children: [
                    {
                        path: 'dashboard',
                        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
                    },
                    {
                        path: 'users',
                        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
                    },
                    {
                        path: 'leaders',
                        loadComponent: () => import('./features/admin/leaders/leaders.component').then(m => m.LeadersComponent)
                    },
                    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
                ]
            },
            {
                path: 'digitador',
                canActivate: [authGuard],
                data: { role: 'digitador' },
                children: [
                    {
                        path: 'register',
                        loadComponent: () => import('./features/digitador/register-voter/register-voter.component').then(m => m.RegisterVoterComponent)
                    },
                    { path: '', redirectTo: 'register', pathMatch: 'full' }
                ]
            }
        ]
    },
    { path: '**', component: RoleRedirectComponent }
];
