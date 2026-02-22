import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { VoterService } from '../../core/services/voter.service';
import { User } from '../../core/models/user.model';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, UiButtonComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-[var(--background)] texture-dots">
      
      <!-- Mobile Overlay -->
      <div *ngIf="isSidebarOpen" 
           (click)="toggleSidebar()"
           class="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity">
      </div>

      <!-- Sidebar (The "Rack") -->
      <aside [class.translate-x-0]="isSidebarOpen" 
             [class.-translate-x-full]="!isSidebarOpen"
             class="fixed lg:relative w-64 h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-30 transition-transform duration-300 lg:translate-x-0">
        <!-- Logo Area -->
        <div class="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--surface)]">
          <div class="text-white font-display font-medium tracking-tight text-xl">
            SGE
          </div>
          <button (click)="toggleSidebar()" class="lg:hidden text-[var(--muted)]">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <div class="text-xs font-mono text-[var(--muted)] uppercase tracking-wider mb-2 px-2">
            Módulos de Comando
          </div>

          <!-- Admin Links -->
          <ng-container *ngIf="isAdmin()">
            <a routerLink="/admin/dashboard" 
               (click)="closeSidebarOnMobile()"
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
              Dashboard
            </a>

            <a routerLink="/admin/leaders" 
               (click)="closeSidebarOnMobile()"
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
               Gestión de Líderes
            </a>

            <a routerLink="/admin/users" 
               (click)="closeSidebarOnMobile()"
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
               Gestión de Digitadores
            </a>

            <a routerLink="/admin/chiefs" 
               (click)="closeSidebarOnMobile()"
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
               Gestión de Jefes
            </a>
          </ng-container>

          <!-- Viewer Links -->
          <ng-container *ngIf="isViewer()">
            <a routerLink="/viewer/dashboard" 
               (click)="closeSidebarOnMobile()"
               routerLinkActive="bg-white/5 text-white border-white/10" 
               class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
              Dashboard
            </a>
          </ng-container>

          <!-- Digitador Links -->
          <ng-container *ngIf="isDigitador()">
              <a routerLink="/digitador/leaders" 
                 (click)="closeSidebarOnMobile()"
                 routerLinkActive="bg-white/5 text-white border-white/10" 
                 class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
                 <span class="w-2 h-2 rounded-full bg-[var(--primary)] mr-3 opacity-50 group-hover:opacity-100"></span>
                 Gestión de Líderes
              </a>

              <a routerLink="/digitador/register" 
                 (click)="closeSidebarOnMobile()"
                 routerLinkActive="bg-white/5 text-white border-white/10" 
                 class="flex items-center px-3 py-2 text-sm font-medium text-[var(--muted)] rounded-[var(--radius-sm)] border border-transparent hover:bg-white/5 hover:text-white transition-all group">
                 <span class="w-2 h-2 rounded-full bg-[var(--secondary)] mr-3 opacity-50 group-hover:opacity-100"></span>
                Registro de Votantes
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
                <span class="text-sm font-medium text-white truncate max-w-[100px]">{{ user()?.fullName || user()?.username }}</span>
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
      <main class="flex-1 overflow-auto relative w-full">
        <!-- Topbar -->
        <header class="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-30">
          <div class="flex items-center">
              <button (click)="toggleSidebar()" class="mr-4 lg:hidden text-[var(--muted)]">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div class="text-[var(--muted)] font-mono text-xs hidden sm:block">
                ESTADO DEL SISTEMA: <span class="text-emerald-500">EN LÍNEA</span> // {{ currentTime | date:'mediumTime' }}
              </div>
          </div>
          <div class="flex items-center space-x-3">
              <app-ui-button *ngIf="!isViewer()" variant="primary" size="sm" (onClick)="generateReport()" [loading]="isReporting">
                  GENERAR REPORTE
              </app-ui-button>
          </div>
        </header>

        <div class="p-4 sm:p-6">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  voterService = inject(VoterService);
  user: Signal<User | null> = this.authService.currentUser;
  currentTime = new Date();
  isSidebarOpen = false;
  isReporting = false;

  isAdmin() {
    return this.authService.isAdmin();
  }

  isDigitador() {
    return this.authService.isDigitador();
  }

  isViewer() {
    return this.authService.isViewer();
  }

  logout() {
    this.authService.logout();
  }

  userInitials() {
    const name = this.user()?.fullName || this.user()?.username || 'U';
    return name.substring(0, 2).toUpperCase();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebarOnMobile() {
    this.isSidebarOpen = false;
  }

  generateReport() {
    this.isReporting = true;
    this.voterService.getReport().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-sge-${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.isReporting = false;
      },
      error: (err) => {
        console.error('Failed to download report', err);
        this.isReporting = false;
        alert('Error al generar el reporte global.');
      }
    });
  }
}
