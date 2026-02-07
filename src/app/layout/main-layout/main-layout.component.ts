import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="flex h-screen overflow-hidden bg-[var(--background)] texture-dots">
      <!-- Sidebar (The "Rack") -->
      <aside class="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col relative z-20">
        <!-- Logo Area -->
        <div class="h-16 flex items-center px-6 border-b border-[var(--border)] bg-[var(--surface)]">
          <div class="text-white font-display font-medium tracking-tight text-xl">
            SGE <span class="text-[var(--primary)]">BITECSO</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <div class="text-xs font-mono text-[var(--muted)] uppercase tracking-wider mb-2 px-2">
            Command Modules
          </div>

          <!-- Admin Links -->
          <ng-container *ngIf="isAdmin()">
            <a routerLink="/admin/dashboard" 
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
              <span class="w-2 h-2 rounded-full bg-[var(--primary)] mr-3 opacity-50 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity"></span>
              Mission Control
            </a>
            <a routerLink="/admin/users" 
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
               <span class="w-2 h-2 rounded-full bg-[var(--muted)] mr-3 opacity-50 group-hover:opacity-100"></span>
              Operatives
            </a>
          </ng-container>

          <!-- Digitador Links -->
          <ng-container *ngIf="!isAdmin()">
            <a routerLink="/digitador/register" 
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
               <span class="w-2 h-2 rounded-full bg-[var(--secondary)] mr-3 opacity-50 group-hover:opacity-100"></span>
              Voter Intake
            </a>
          </ng-container>
        </nav>

        <!-- User Profile (Bottom) -->
        <div class="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--primary)]/20 border border-[var(--primary)]/50 flex items-center justify-center text-[var(--primary)] font-mono text-xs">
                {{ userInitials() }}
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-medium text-white truncate max-w-[100px]">{{ user()?.username }}</span>
                <span class="text-xs text-[var(--muted)] capitalize">{{ user()?.role }}</span>
              </div>
            </div>
            <button (click)="logout()" class="text-[var(--muted)] hover:text-red-400 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto relative z-10">
        <!-- Topbar (if needed for breadcrumbs or extra actions) -->
        <header class="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-30">
          <div class="text-[var(--muted)] font-mono text-xs">
            SYSTEM STATUS: <span class="text-emerald-500">ONLINE</span> // {{ currentTime | date:'mediumTime' }}
          </div>
        </header>

        <div class="p-6">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class MainLayoutComponent {
    authService = inject(AuthService);
    user = this.authService.currentUser;
    currentTime = new Date();

    isAdmin() {
        return this.authService.isAdmin();
    }

    logout() {
        this.authService.logout();
    }

    userInitials() {
        const name = this.user()?.username || 'U';
        return name.substring(0, 2).toUpperCase();
    }
}
