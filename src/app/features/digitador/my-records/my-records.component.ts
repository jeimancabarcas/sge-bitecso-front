import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoterService, VoterResponse, Voter } from '../../../core/services/voter.service';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';

@Component({
    selector: 'app-my-records',
    standalone: true,
    imports: [CommonModule, UiCardComponent, UiButtonComponent],
    template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
           <h2 class="text-2xl font-display font-medium text-white tracking-tight">MIS REGISTROS</h2>
           <p class="text-[var(--muted)] text-sm">Historial de votantes registrados y estado de verificación.</p>
        </div>
        <div class="flex space-x-2">
            <app-ui-button variant="outline" (onClick)="loadRecords()">
                ACTUALIZAR
            </app-ui-button>
        </div>
      </div>

      <app-ui-card>
        <!-- Loading State -->
        <div *ngIf="loading()" class="py-12 text-center text-[var(--muted)] animate-pulse">
            CARGANDO DATOS DEL SISTEMA...
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="py-12 text-center text-red-500 font-mono text-sm">
            {{ error() }}
        </div>

        <!-- Data Table -->
        <div *ngIf="!loading() && !error()" class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-xs font-mono text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">
                        <th class="p-3">Cédula</th>
                        <th class="p-3">Nombre</th>
                        <th class="p-3">Teléfono</th>
                        <th class="p-3">Líder</th>
                        <th class="p-3">Estado</th>
                        <th class="p-3">Fecha</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border)]">
                    <tr *ngFor="let voter of data()?.items" class="group hover:bg-white/5 transition-colors">
                        <td class="p-3 font-mono text-[var(--foreground)]">{{ voter.cedula }}</td>
                        <td class="p-3 font-medium text-white">{{ voter.nombre }}</td>
                        <td class="p-3 text-[var(--muted)]">{{ voter.telefono }}</td>
                        <td class="p-3 text-[var(--primary)]">{{ voter.leader?.nombre || 'N/A' }}</td>
                        <td class="p-3">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide cursor-help"
                                [ngClass]="getStatusClass(voter.verification_status)"
                                (mouseenter)="showTooltip($event, voter)"
                                (mouseleave)="hideTooltip()">
                                {{ voter.verification_status || 'PENDING' }}
                            </span>
                        </td>
                        <td class="p-3 text-[var(--muted)] text-xs font-mono">
                            {{ voter.created_at | date:'short' }}
                        </td>
                    </tr>
                    
                    <!-- Empty State -->
                    <tr *ngIf="data()?.items?.length === 0">
                        <td colspan="6" class="p-12 text-center text-[var(--muted)]">
                            No se encontraron registros.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="data()" class="border-t border-[var(--border)] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <!-- Limit Selector -->
            <div class="flex items-center space-x-2">
                <span class="text-xs text-[var(--muted)] font-mono">Filas:</span>
                <select 
                    [value]="limit" 
                    (change)="changeLimit($any($event.target).value)"
                    class="bg-[var(--background)] text-white text-xs border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-1 focus:border-[var(--primary)] outline-none"
                >
                    <option *ngFor="let opt of [5, 10, 20]" [value]="opt">{{ opt }}</option>
                </select>
                <span class="text-xs text-[var(--muted)] font-mono">
                    | Pág {{ data()?.page }} de {{ data()?.totalPages }} (Total: {{ data()?.total }})
                </span>
            </div>

            <div class="flex space-x-2">
                <button 
                    [disabled]="data()?.page === 1"
                    (click)="changePage(data()!.page - 1)"
                    class="px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--foreground)] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ANTERIOR
                </button>
                <button 
                    [disabled]="data()?.page === data()?.totalPages"
                    (click)="changePage(data()!.page + 1)"
                    class="px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--foreground)] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    SIGUIENTE
                </button>
            </div>
        </div>
      </app-ui-card>

      <!-- Fixed Tooltip Portal -->
      <div *ngIf="hoveredVoter" 
           class="fixed z-[100] w-64 bg-[#0f172a] border border-[var(--primary)]/30 text-xs text-white p-3 rounded-[var(--radius-sm)] shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-none transition-opacity duration-150 animate-fade-in"
           [style.top.px]="tooltipPosition.top"
           [style.left.px]="tooltipPosition.left">
          
          <div class="font-bold mb-2 text-[var(--secondary)] uppercase tracking-wide border-b border-white/10 pb-1">
              DETALLE DE VERIFICACIÓN
          </div>
          <div class="text-[11px] leading-relaxed italic text-white/90">
              {{ (hoveredVoter.verification_logs && hoveredVoter.verification_logs.length > 0) 
                  ? hoveredVoter.verification_logs[0].message 
                  : 'Sin detalles disponibles en el sistema.' }}
          </div>
          <div *ngIf="hoveredVoter.verification_logs && hoveredVoter.verification_logs.length > 0" class="mt-2 text-[9px] text-[var(--muted)] font-mono text-right">
              {{ hoveredVoter.verification_logs[0].attempted_at | date:'short' }}
          </div>
      </div>
    </div>
  `
})
export class MyRecordsComponent implements OnInit {
    private voterService = inject(VoterService);

    data = signal<VoterResponse | null>(null);
    loading = signal(false);
    error = signal('');

    currentPage = signal(1);
    limit = 5; // Default to 5 as requested

    // Tooltip State
    hoveredVoter: Voter | null = null;
    tooltipPosition = { top: 0, left: 0 };

    ngOnInit() {
        this.loadRecords();
    }

    loadRecords() {
        this.loading.set(true);
        this.error.set('');

        this.voterService.getMyRecords(this.currentPage(), this.limit).subscribe({
            next: (response) => {
                this.data.set(response);
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.error.set('Error al cargar los registros. Intente nuevamente.');
                this.loading.set(false);
            }
        });
    }

    changePage(page: number) {
        this.currentPage.set(page);
        this.loadRecords();
    }

    changeLimit(newLimit: string) {
        this.limit = parseInt(newLimit, 10);
        this.currentPage.set(1); // Reset to first page
        this.loadRecords();
    }

    getStatusClass(status?: string): string {
        switch (status) {
            case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
            case 'FAILED': return 'bg-red-500/10 text-red-500 border border-red-500/20';
            case 'ERROR': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
        }
    }

    showTooltip(event: MouseEvent, voter: Voter) {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        const tooltipHeight = 100;
        const showBelow = rect.top < 150;

        this.hoveredVoter = voter;

        this.tooltipPosition = {
            left: rect.left + (rect.width / 2) - 128, // Center
            top: showBelow ? (rect.bottom + 10) : (rect.top - tooltipHeight - 10)
        };
    }

    hideTooltip() {
        this.hoveredVoter = null;
    }
}
