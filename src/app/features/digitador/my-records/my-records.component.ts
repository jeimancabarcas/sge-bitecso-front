import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { VoterService, VoterResponse, Voter } from '../../../core/services/voter.service';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ChiefService } from '../../../core/services/chief.service';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui-select/ui-select.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-my-records',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, UiCardComponent, UiButtonComponent, UiInputComponent, UiSelectComponent],
    template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 class="text-2xl font-display font-medium text-white tracking-tight">MIS REGISTROS</h2>
           <p class="text-[var(--muted)] text-sm">Historial de votantes registrados y estado de verificación.</p>
        </div>
        <div class="flex flex-wrap gap-2">
            <app-ui-button variant="primary" (onClick)="isReportModalOpen = true">
                REPORTE LÍDER
            </app-ui-button>
            <app-ui-button variant="primary" (onClick)="isChiefReportModalOpen = true">
                REPORTE JEFE
            </app-ui-button>
            <app-ui-button variant="outline" (onClick)="loadRecords()">
                ACTUALIZAR
            </app-ui-button>
        </div>
      </div>

      <app-ui-card>
        <!-- Search Bar -->
        <div class="mb-6">
            <div class="relative max-w-md">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted)]">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>
                <input 
                    type="text" 
                    [formControl]="searchControl"
                    placeholder="Buscar por cédula o nombre..." 
                    class="block w-full pl-10 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-sm)] text-sm text-white placeholder-[var(--muted)] outline-none focus:border-[var(--primary)] transition-colors"
                >
            </div>
        </div>

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
                        <th class="p-3 text-center">Acciones</th>
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
                        <td class="p-3 text-center">
                            <button *ngIf="canEdit(voter)" (click)="openEditModal(voter)" class="text-[var(--secondary)] hover:text-[var(--secondary)]/80 transition-colors p-1" title="Editar Registro">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                    
                    <!-- Empty State -->
                    <tr *ngIf="data()?.items?.length === 0">
                        <td colspan="7" class="p-12 text-center text-[var(--muted)]">
                            No se encontraron registros{{ searchControl.value ? ' que coincidan con "' + searchControl.value + '"' : '' }}.
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

      <!-- Report Selection Modal -->
      <div *ngIf="isReportModalOpen" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-md p-6 space-y-6 shadow-2xl animate-fade-in relative">
          <button (click)="isReportModalOpen = false" class="absolute top-4 right-4 text-[var(--muted)] hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h3 class="text-xl font-display font-medium text-white mb-1">GENERAR REPORTE</h3>
            <p class="text-[var(--muted)] text-sm font-mono">Seleccione el líder para filtrar el reporte electoral.</p>
          </div>
          <div class="space-y-4">
             <div class="mb-4">
                <label class="block text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1.5 ml-0.5">SELECCIONAR LÍDER</label>
                <select 
                    [(ngModel)]="selectedLeaderId"
                    class="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 text-white outline-none focus:border-[var(--primary)] text-sm"
                >
                    <option [value]="null">TODOS LOS LÍDERES</option>
                    <option *ngFor="let leader of leaderOptions" [value]="leader.id">{{ leader.nombre }}</option>
                </select>
             </div>
            <div class="pt-4 flex flex-col gap-3">
              <app-ui-button variant="primary" [fullWidth]="true" (onClick)="downloadReportByLeader()" [loading]="generatingReport">
                DESCARGAR REPORTE EXCEL
              </app-ui-button>
              <app-ui-button variant="outline" [fullWidth]="true" (onClick)="isReportModalOpen = false">
                CANCELAR
              </app-ui-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Selection Modal (Chief) -->
      <div *ngIf="isChiefReportModalOpen" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-md p-6 space-y-6 shadow-2xl animate-fade-in relative">
          <button (click)="isChiefReportModalOpen = false" class="absolute top-4 right-4 text-[var(--muted)] hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h3 class="text-xl font-display font-medium text-white mb-1">GENERAR REPORTE (JEFE)</h3>
            <p class="text-[var(--muted)] text-sm font-mono">Seleccione el jefe para filtrar el reporte electoral.</p>
          </div>
          <div class="space-y-4">
             <div class="mb-4">
                <label class="block text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1.5 ml-0.5">SELECCIONAR JEFE</label>
                <select 
                    [(ngModel)]="selectedChiefId"
                    class="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 text-white outline-none focus:border-[var(--primary)] text-sm"
                >
                    <option [value]="null">TODOS LOS JEFES</option>
                    <option *ngFor="let chief of chiefOptions" [value]="chief.id">{{ chief.nombre }}</option>
                </select>
             </div>
            <div class="pt-4 flex flex-col gap-3">
              <app-ui-button variant="primary" [fullWidth]="true" (onClick)="downloadReportByChief()" [loading]="generatingReport">
                DESCARGAR REPORTE EXCEL
              </app-ui-button>
              <app-ui-button variant="outline" [fullWidth]="true" (onClick)="isChiefReportModalOpen = false">
                CANCELAR
              </app-ui-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div *ngIf="isEditModalOpen" class="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-2xl p-6 space-y-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
          <button (click)="closeEditModal()" class="absolute top-4 right-4 text-[var(--muted)] hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h3 class="text-xl font-display font-medium text-white mb-1 uppercase tracking-tight">EDITAR REGISTRO</h3>
            <p class="text-[var(--muted)] text-sm font-mono">Actualice los datos del votante antes de la próxima verificación.</p>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="space-y-4">
            <app-ui-input 
              label="CÉDULA" 
              placeholder="Número de identificación" 
              formControlName="cedula"
              [required]="true"
            ></app-ui-input>
            <app-ui-input 
              label="NOMBRE COMPLETO" 
              placeholder="Nombres y Apellidos" 
              formControlName="nombre"
              [required]="true"
            ></app-ui-input>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <app-ui-input 
                label="TELÉFONO" 
                placeholder="Número Celular" 
                formControlName="telefono"
              ></app-ui-input>
              <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-[var(--muted)] uppercase tracking-wider ml-0.5">LÍDER ASIGNADO</label>
                  <select 
                      formControlName="leader_id"
                      class="w-full bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 text-white outline-none focus:border-[var(--primary)] text-sm"
                  >
                      <option [value]="null">Seleccione un Líder</option>
                      <option *ngFor="let leader of leaderOptions" [value]="leader.id">{{ leader.nombre }}</option>
                  </select>
              </div>
            </div>
            <div class="pt-6 flex gap-3">
              <app-ui-button variant="outline" [fullWidth]="true" type="button" (onClick)="closeEditModal()">
                CANCELAR
              </app-ui-button>
              <app-ui-button variant="secondary" [fullWidth]="true" type="submit" [loading]="isSavingEdit">
                GUARDAR CAMBIOS
              </app-ui-button>
            </div>
            <div *ngIf="editError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] text-red-400 text-xs font-mono text-center">
                {{ editError }}
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class MyRecordsComponent implements OnInit {
    private voterService = inject(VoterService);
    private chiefService = inject(ChiefService);
    private fb = inject(FormBuilder);

    data = signal<VoterResponse | null>(null);
    loading = signal(false);
    error = signal('');

    // Search Logic
    searchControl = new FormControl('');

    // Report Logic
    isReportModalOpen = false;
    generatingReport = false;
    selectedLeaderId: string | null = null;
    leaderOptions: any[] = [];

    // Chief Report Logic
    isChiefReportModalOpen = false;
    selectedChiefId: string | null = null;
    chiefOptions: any[] = [];

    currentPage = signal(1);
    limit = 5;

    // Tooltip State
    hoveredVoter: Voter | null = null;
    tooltipPosition = { top: 0, left: 0 };

    // Edit State
    isEditModalOpen = false;
    isSavingEdit = false;
    editingVoterId: string | null = null;
    editError = '';
    editForm = this.fb.group({
        cedula: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        telefono: ['', [Validators.pattern('^[0-9]*$')]],
        leader_id: [null as string | null, [Validators.required]]
    });

    ngOnInit() {
        this.loadRecords();
        this.loadLeaders();
        this.loadChiefs();

        // Setup search debounce logic with 500ms delay
        this.searchControl.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.currentPage.set(1);
            this.loadRecords();
        });
    }

    onSearchChange(query: string) {
        // Method no longer needed with FormControl valueChanges
    }

    loadLeaders() {
        this.voterService.getLeaders().subscribe({
            next: (data) => this.leaderOptions = data,
            error: (err) => console.error('Error loading leaders for report', err)
        });
    }

    loadChiefs() {
        this.chiefService.findAll().subscribe({
            next: (data) => this.chiefOptions = data,
            error: (err) => console.error('Error loading chiefs for report', err)
        });
    }

    loadRecords() {
        this.loading.set(true);
        this.error.set('');

        const query = this.searchControl.value || '';

        this.voterService.getMyRecords(this.currentPage(), this.limit, query).subscribe({
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

    downloadReportByLeader() {
        this.generatingReport = true;
        this.voterService.getReportByLeader(this.selectedLeaderId || undefined).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                let leaderName = 'TODOS';
                if (this.selectedLeaderId) {
                    const selected = this.leaderOptions.find(o => o.id === this.selectedLeaderId);
                    if (selected) leaderName = selected.nombre.replace(/\s+/g, '_').toUpperCase();
                }

                const fileName = `REPORTE_LIDER_${leaderName}_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
                this.generatingReport = false;
                this.isReportModalOpen = false;
            },
            error: (err: any) => {
                console.error('Failed to download report by leader', err);
                this.generatingReport = false;
            }
        });
    }

    downloadReportByChief() {
        this.generatingReport = true;
        this.voterService.getReportByChief(this.selectedChiefId || undefined).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                let chiefName = 'TODOS';
                if (this.selectedChiefId) {
                    const selected = this.chiefOptions.find((o: any) => o.id === this.selectedChiefId);
                    if (selected) chiefName = selected.nombre.replace(/\s+/g, '_').toUpperCase();
                }

                const fileName = `REPORTE_JEFE_${chiefName}_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
                this.generatingReport = false;
                this.isChiefReportModalOpen = false;
            },
            error: (err: any) => {
                console.error('Failed to download report by chief', err);
                this.generatingReport = false;
            }
        });
    }

    changePage(page: number) {
        this.currentPage.set(page);
        this.loadRecords();
    }

    changeLimit(newLimit: string) {
        this.limit = parseInt(newLimit, 10);
        this.currentPage.set(1);
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
            left: rect.left + (rect.width / 2) - 128,
            top: showBelow ? (rect.bottom + 10) : (rect.top - tooltipHeight - 10)
        };
    }

    hideTooltip() {
        this.hoveredVoter = null;
    }

    canEdit(voter: Voter): boolean {
        return true; // All records can be edited as requested
    }

    openEditModal(voter: Voter) {
        this.editingVoterId = voter.id || null;
        this.editError = '';
        this.editForm.patchValue({
            cedula: voter.cedula,
            nombre: voter.nombre,
            telefono: voter.telefono || '',
            leader_id: voter.leader_id || (voter.leader?.id as any) || null
        });
        this.isEditModalOpen = true;
    }

    closeEditModal() {
        this.isEditModalOpen = false;
        this.editingVoterId = null;
        this.editForm.reset();
    }

    saveEdit() {
        if (this.editForm.invalid || !this.editingVoterId) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.isSavingEdit = true;
        this.editError = '';
        const payload = this.editForm.value as Partial<Voter>;
        this.voterService.updateVoter(this.editingVoterId, payload).subscribe({
            next: () => {
                this.isSavingEdit = false;
                this.closeEditModal();
                this.loadRecords();
            },
            error: (err) => {
                this.isSavingEdit = false;
                this.editError = err.error?.message || 'Error al actualizar el registro.';
                console.error(err);
            }
        });
    }
}
