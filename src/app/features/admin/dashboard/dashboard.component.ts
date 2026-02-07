import { Component, OnInit, inject } from '@angular/core';
import { UiSelectComponent } from '../../../shared/components/ui-select/ui-select.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { VoterService, DashboardStats, RealDashboardStats, DigitadorStats, LeaderStats, Voter } from '../../../core/services/voter.service';
import { UiStatTileComponent } from '../../../shared/components/ui-stat-tile/ui-stat-tile.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, UiStatTileComponent, UiCardComponent, UiButtonComponent, UiSelectComponent],
    template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-display font-medium text-white tracking-tight">DASHBOARD</h2>
        <div class="flex space-x-3">
           <app-ui-button variant="outline" (onClick)="refresh()">ACTUALIZAR DATOS</app-ui-button>
           <app-ui-button variant="primary" (onClick)="generateReport()">GENERAR REPORTE</app-ui-button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <app-ui-stat-tile 
          label="Total Registrados" 
          [value]="realStats?.total || 0" 
          [trend]="0" 
          [progress]="100"
          [loading]="loadingStats">
        </app-ui-stat-tile>
        
        <app-ui-stat-tile 
          label="Pendientes por Validar" 
          [value]="realStats?.pending || 0" 
          [trend]="0" 
          [progress]="calculateProgress(realStats?.pending, realStats?.total)"
          [loading]="loadingStats">
        </app-ui-stat-tile>
        
        <app-ui-stat-tile 
          label="Validación Exitosa" 
          [value]="realStats?.success || 0" 
          [trend]="0" 
          [progress]="calculateProgress(realStats?.success, realStats?.total)"
          [loading]="loadingStats">
        </app-ui-stat-tile>
        
        <app-ui-stat-tile 
          label="Validación Fallida" 
          [value]="realStats?.failed || 0" 
          [trend]="0" 
          [progress]="calculateProgress(realStats?.failed, realStats?.total)"
          [loading]="loadingStats">
        </app-ui-stat-tile>

        <app-ui-stat-tile 
          label="Error del Sistema" 
          [value]="realStats?.error || 0" 
          [trend]="0" 
          [progress]="calculateProgress(realStats?.error, realStats?.total)"
          [loading]="loadingStats">
        </app-ui-stat-tile>
      </div>

      <!-- Main Data Area -->
      <div class="flex flex-col lg:flex-row gap-6 items-start">
        <!-- Voter Table (2/3 width) -->
        <div class="w-full lg:w-2/3">
          <app-ui-card title="REGISTRO DE ACTIVIDAD EN VIVO">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)] font-mono tracking-wider">
                    <th class="p-3">ID / Cédula</th>
                    <th class="p-3">Nombre Votante</th>
                    <th class="p-3">Mesa</th>
                    <th class="p-3">Agente</th>
                    <th class="p-3">Hora</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border)]">
                  <tr *ngFor="let voter of voters" class="group hover:bg-white/5 transition-colors">
                    <td class="p-3 font-mono text-white">{{ voter.cedula }}</td>
                    <td class="p-3 text-[var(--foreground)]">{{ voter.nombre }}</td>
                    <td class="p-3 overflow-visible">
                      <div class="inline-block relative" 
                           (mouseenter)="showTooltip($event, voter)" 
                           (mouseleave)="hideTooltip()">
                        <span class="badge-success cursor-help">
                            Mesa {{ voter.mesa || voter.detail?.table || 'N/A' }}
                        </span>
                      </div>
                    </td>
                    <td class="p-3 text-sm text-[var(--muted)]">{{ voter.created_by?.username || voter.digitador || 'N/A' }}</td>
                    <td class="p-3 text-xs font-mono text-[var(--muted)]">
                      {{ voter.created_at | date:'HH:mm:ss' }}
                    </td>
                  </tr>
                  
                  <tr *ngIf="voters.length === 0 && !loading">
                    <td colspan="5" class="p-8 text-center text-[var(--muted)]">
                        No hay registros disponibles.
                    </td>
                  </tr>
                  
                  <!-- Loading State -->
                  <tr *ngIf="loading">
                    <td colspan="5" class="p-8 text-center text-[var(--muted)]">
                        <div class="flex items-center justify-center space-x-2 animate-pulse">
                            <span class="w-2 h-2 bg-[var(--primary)] rounded-full"></span>
                            <span class="w-2 h-2 bg-[var(--primary)] rounded-full animation-delay-200"></span>
                            <span class="w-2 h-2 bg-[var(--primary)] rounded-full animation-delay-400"></span>
                            <span class="text-sm font-mono ml-2">Cargando información...</span>
                        </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            <div class="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="text-xs text-[var(--muted)] font-mono">
                        Mostrando {{ voters.length }} de {{ totalVoters }} registros
                </div>

                <div class="flex items-center gap-4">
                    <!-- Limit Selector -->
                    <div class="w-32">
                        <app-ui-select
                            [options]="limitOptions"
                            [(ngModel)]="limit"
                            (ngModelChange)="changeLimit($event)"
                            placeholder="Filas"
                            [searchable]="false"
                        ></app-ui-select>
                    </div>

                    <!-- Pagination Controls -->
                    <div class="flex items-center space-x-2">
                        <app-ui-button 
                            variant="outline" 
                            size="sm"
                            [disabled]="page === 1"
                            (onClick)="changePage(page - 1)">
                            Prev
                        </app-ui-button>
                        
                        <span class="text-xs font-mono text-[var(--foreground)]">
                            Pág {{ page }} / {{ totalPages }}
                        </span>

                        <app-ui-button 
                            variant="outline" 
                            size="sm"
                            [disabled]="page === totalPages"
                            (onClick)="changePage(page + 1)">
                            Next
                        </app-ui-button>
                    </div>
                </div>
            </div>
          </app-ui-card>
        </div>

        <!-- Stats Panel (1/3 width) -->
        <div class="w-full lg:w-1/3 space-y-6">
          <!-- Digitador Stats -->
          <app-ui-card title="RENDIMIENTO DE EQUIPO">
            <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[var(--border)] text-[10px] uppercase text-[var(--muted)] font-mono tracking-wider sticky top-0 bg-[var(--surface)] z-10">
                    <th class="p-2">Agente</th>
                    <th class="p-2 text-center">Total</th>
                    <th class="p-2 text-center">Wait</th>
                    <th class="p-2 text-center">OK</th>
                    <th class="p-2 text-center">Fail</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border)]">
                  <tr *ngFor="let stat of digitatorsStats" class="group hover:bg-white/5 transition-colors">
                    <td class="p-2">
                        <div class="flex flex-col">
                            <span class="text-xs font-medium text-[var(--foreground)]">{{ stat.username }}</span>
                            <!-- Mini Progress Bar -->
                            <div class="w-full h-0.5 bg-[var(--background)] mt-1 rounded-full overflow-hidden">
                                <div class="h-full bg-[var(--primary)]" [style.width.%]="calculateProgress(stat.success, stat.total)"></div>
                            </div>
                        </div>
                    </td>
                    <td class="p-2 text-center">
                        <span class="text-xs font-mono text-[var(--foreground)]">{{ stat.total }}</span>
                    </td>
                    <td class="p-2 text-center">
                        <span class="text-xs font-mono text-amber-500">{{ stat.pending }}</span>
                    </td>
                    <td class="p-2 text-center">
                        <span class="text-xs font-mono text-emerald-500">{{ stat.success }}</span>
                    </td>
                    <td class="p-2 text-center">
                         <span class="text-xs font-mono text-red-500">{{ stat.failed + stat.error }}</span>
                    </td>
                  </tr>
                  
                  <tr *ngIf="digitatorsStats.length === 0 && !loadingStats">
                    <td colspan="5" class="p-4 text-center text-xs text-[var(--muted)]">
                        No hay datos disponibles.
                    </td>
                  </tr>
                  
                   <!-- Loading State for Team -->
                  <tr *ngIf="loadingStats">
                    <td colspan="5" class="p-4 text-center text-[var(--muted)]">
                         <div class="flex justify-center animate-pulse">
                            <span class="h-1 w-24 bg-white/10 rounded"></span>
                         </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </app-ui-card>

          <!-- Leader Stats -->
          <app-ui-card title="RENDIMIENTO DE LÍDERES">
            <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[var(--border)] text-[10px] uppercase text-[var(--muted)] font-mono tracking-wider sticky top-0 bg-[var(--surface)] z-10">
                    <th class="p-2">Líder</th>
                    <th class="p-2 text-center">Total</th>
                    <th class="p-2 text-center">Wait</th>
                    <th class="p-2 text-center">OK</th>
                    <th class="p-2 text-center">Fail</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border)]">
                  <tr *ngFor="let stat of leadersStats" class="group hover:bg-white/5 transition-colors">
                    <td class="p-2">
                        <div class="flex flex-col">
                            <span class="text-xs font-medium text-[var(--foreground)]">{{ stat.name }}</span>
                            <!-- Mini Progress Bar -->
                            <div class="w-full h-0.5 bg-[var(--background)] mt-1 rounded-full overflow-hidden">
                                <div class="h-full bg-[var(--secondary)]" [style.width.%]="calculateProgress(stat.success, stat.total)"></div>
                            </div>
                        </div>
                    </td>
                    <td class="p-2 text-center">
                        <span class="text-xs font-mono text-[var(--foreground)]">{{ stat.total }}</span>
                    </td>
                    <td class="p-2 text-center">
                        <span class="text-xs font-mono text-amber-500">{{ stat.pending }}</span>
                    </td>
                    <td class="p-2 text-center">
                        <span class="text-xs font-mono text-emerald-500">{{ stat.success }}</span>
                    </td>
                    <td class="p-2 text-center">
                         <span class="text-xs font-mono text-red-500">{{ stat.failed + stat.error }}</span>
                    </td>
                  </tr>
                  
                  <tr *ngIf="leadersStats.length === 0 && !loadingStats">
                    <td colspan="5" class="p-4 text-center text-xs text-[var(--muted)]">
                        No hay datos disponibles.
                    </td>
                  </tr>
                  
                   <!-- Loading State for Leaders -->
                  <tr *ngIf="loadingStats">
                    <td colspan="5" class="p-4 text-center text-[var(--muted)]">
                         <div class="flex justify-center animate-pulse">
                            <span class="h-1 w-24 bg-white/10 rounded"></span>
                         </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </app-ui-card>
        </div>
      </div>
      <!-- Fixed Tooltip Portal -->
      <div *ngIf="hoveredVoter && hoveredVoter.detail" 
           class="fixed z-[100] w-64 bg-[#0f172a] border border-[var(--primary)]/30 text-xs text-white p-3 rounded-[var(--radius-sm)] shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-none transition-opacity duration-150 animate-fade-in"
           [style.top.px]="tooltipPosition.top"
           [style.left.px]="tooltipPosition.left">
          
          <div class="font-bold mb-2 text-[var(--primary)] uppercase tracking-wide border-b border-white/10 pb-1">
              {{ hoveredVoter.detail!.polling_station }}
          </div>
          
          <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
              <span class="text-[var(--muted)]">Mesa:</span> 
              <span class="text-white font-mono">{{ hoveredVoter.detail!.table }}</span>
              
              <span class="text-[var(--muted)]">Municipio:</span> 
              <span class="text-white">{{ hoveredVoter.detail!.municipality }}</span>
              
              <span class="text-[var(--muted)]">Depto:</span> 
              <span class="text-white">{{ hoveredVoter.detail!.department }}</span>
              
              <span class="text-[var(--muted)]">Dirección:</span> 
              <span class="text-white truncate">{{ hoveredVoter.detail!.address }}</span>
          </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    voterService = inject(VoterService);
    stats: DashboardStats | null = null;
    realStats: RealDashboardStats | null = null; // New property
    digitatorsStats: DigitadorStats[] = []; // New property
    leadersStats: LeaderStats[] = []; // New property

    // Tooltip State
    hoveredVoter: Voter | null = null;
    tooltipPosition = { top: 0, left: 0 };

    // Voter Pagination
    voters: Voter[] = [];
    totalVoters: number = 0;
    page: number = 1;
    limit: number = 10;
    totalPages: number = 1;
    loading: boolean = false; // Loading state (Voters)
    loadingStats: boolean = false; // Loading state (Stats)
    limitOptions = [
        { value: 10, label: '10 registros' },
        { value: 20, label: '20 registros' },
        { value: 50, label: '50 registros' }
    ];

    ngOnInit() {
        this.refresh();
        // loadVoters is called in refresh now if needed, or separately? 
        // User wants "Actualizar Datos" to load EVERYTHING.
        // Let's call loadVoters inside refresh or alongside it. 
        // But ngOnInit usually loads initially. 
        // Let's make refresh call everything.
    }

    refresh() {
        this.loadingStats = true;

        // Clear data to show loading state (if desired by user "tout appear loading")
        this.realStats = null;
        this.digitatorsStats = [];
        this.leadersStats = [];

        // Trigger voters load too
        this.loadVoters();

        const requests = {
            stats: this.voterService.getStats(),
            dashboard: this.voterService.getDashboardStats(),
            digitators: this.voterService.getDigitatorsStats(),
            leaders: this.voterService.getLeadersStats()
        };

        forkJoin(requests)
            .pipe(finalize(() => this.loadingStats = false))
            .subscribe({
                next: (results) => {
                    this.stats = results.stats;
                    this.realStats = results.dashboard;
                    this.digitatorsStats = results.digitators;
                    this.leadersStats = results.leaders;
                },
                error: (err) => console.error('Failed to refresh data', err)
            });
    }

    loadVoters() {
        this.loading = true;
        this.voters = []; // Clear current data to show only loader
        this.voterService.getVoters(this.page, this.limit).subscribe({
            next: (response) => {
                this.voters = response.items;
                this.totalVoters = response.total;
                this.totalPages = response.totalPages;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load voters', err);
                this.loading = false;
            }
        });
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.page = newPage;
            this.loadVoters();
        }
    }

    generateReport() {
        // Optional: Add loading state for report button if desired
        this.voterService.getReport().subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte-votantes-${new Date().getTime()}.xlsx`; // Or .csv / .pdf depending on backend
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            },
            error: (err) => console.error('Failed to download report', err)
        });
    }

    changeLimit(newLimit: number) {
        this.limit = newLimit;
        this.page = 1; // Reset to first page
        this.loadVoters();
    }

    calculateProgress(value: number = 0, total: number = 0): number {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    showTooltip(event: MouseEvent, voter: Voter) {
        if (!voter.detail) return;

        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        // Calculate position (centered above the element)
        // Check if closer to top or bottom to flip? For now, default to above.
        // If top < 150px, show below.

        const tooltipHeight = 140; // Approx
        const showBelow = rect.top < 150;

        this.hoveredVoter = voter;

        this.tooltipPosition = {
            left: rect.left + (rect.width / 2) - 128, // Center (256px width / 2)
            top: showBelow ? (rect.bottom + 10) : (rect.top - tooltipHeight - 10)
        };
    }

    hideTooltip() {
        this.hoveredVoter = null;
    }
}
