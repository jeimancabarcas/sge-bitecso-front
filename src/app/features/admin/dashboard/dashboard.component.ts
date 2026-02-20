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
import { UiChartComponent } from '../../../shared/components/ui-chart/ui-chart.component';
import { ChiefService, ChiefStats } from '../../../core/services/chief.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UiStatTileComponent, UiCardComponent, UiButtonComponent, UiSelectComponent, UiChartComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-display font-medium text-white tracking-tight">DASHBOARD</h2>
        <div class="flex items-center space-x-3">
           <app-ui-button variant="primary" size="sm" (onClick)="isReportModalOpen = true">REPORTE POR LÍDER</app-ui-button>
           <app-ui-button variant="primary" size="sm" (onClick)="isChiefReportModalOpen = true">REPORTE POR JEFE</app-ui-button>
           <app-ui-button variant="outline" size="sm" (onClick)="downloadReport()">REPORTE GENERAL</app-ui-button>
           <app-ui-button variant="outline" size="sm" (onClick)="refresh()" [loading]="loadingStats">REFRESCAR</app-ui-button>
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
      
      <!-- Charts Section (Below Stats Cards) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Status Distribution Chart (Doughnut) -->
          <app-ui-card title="DISTRIBUCIÓN POR ESTADO">
            <div class="flex flex-col md:flex-row items-center gap-6">
              <div class="w-full md:w-1/2 max-w-[200px]">
                <app-ui-chart
                    type="doughnut"
                    [data]="statusChartData"
                    [labels]="statusChartLabels"
                    [colors]="statusChartColors"
                    [loading]="loadingStats">
                </app-ui-chart>
              </div>
              
              <!-- Legend Icons -->
              <div class="grid grid-cols-2 gap-x-6 gap-y-3 w-full md:w-1/2">
                <div class="flex items-center space-x-2">
                   <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] bg-emerald-500"></span>
                   <span class="text-[11px] text-[var(--muted)] uppercase font-mono">Éxito</span>
                   <span class="text-xs text-white font-mono ml-auto">{{ realStats?.success || 0 }}</span>
                </div>
                <div class="flex items-center space-x-2">
                   <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)] bg-blue-500"></span>
                   <span class="text-[11px] text-[var(--muted)] uppercase font-mono">Espera</span>
                   <span class="text-xs text-white font-mono ml-auto">{{ realStats?.pending || 0 }}</span>
                </div>
                <div class="flex items-center space-x-2">
                   <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)] bg-red-500"></span>
                   <span class="text-[11px] text-[var(--muted)] uppercase font-mono">Fallo</span>
                   <span class="text-xs text-white font-mono ml-auto">{{ realStats?.failed || 0 }}</span>
                </div>
                <div class="flex items-center space-x-2">
                   <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)] bg-amber-500"></span>
                   <span class="text-[11px] text-[var(--muted)] uppercase font-mono">Error</span>
                   <span class="text-xs text-white font-mono ml-auto">{{ realStats?.error || 0 }}</span>
                </div>
              </div>
            </div>
          </app-ui-card> 

          <!-- Chief Performance Chart (Bar) -->
          <app-ui-card title="RENDIMIENTO POR JEFES">
            <div class="h-full min-h-[220px]">
               <app-ui-chart
                  type="bar"
                  [data]="chiefChartData"
                  [labels]="chiefChartLabels"
                  [colors]="chiefChartColors"
                  [loading]="loadingStats">
               </app-ui-chart>
            </div>
          </app-ui-card>
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
                    <th class="p-3">Nombre</th>
                    <th class="p-3">Mesa</th>
                    <th class="p-3">Líder</th>
                    <th class="p-3">Digitador</th>
                    <th class="p-3">Estado</th>
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
                    <td class="p-3 text-sm text-[var(--primary)]">{{ voter.leader?.nombre || 'N/A' }}</td>
                    <td class="p-3 text-sm text-[var(--muted)]">{{ voter.created_by?.username || voter.digitador || 'N/A' }}</td>
                    <td class="p-3">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide cursor-help"
                            [ngClass]="getStatusClass(voter.verification_status)"
                            (mouseenter)="showTooltip($event, voter, 'status')"
                            (mouseleave)="hideTooltip()">
                            {{ voter.verification_status || 'PENDING' }}
                        </span>
                    </td>
                    <td class="p-3 text-xs font-mono text-[var(--muted)]">
                      {{ voter.created_at | date:'HH:mm:ss' }}
                    </td>
                  </tr>
                  
                  <tr *ngIf="voters.length === 0 && !loading">
                    <td colspan="7" class="p-8 text-center text-[var(--muted)]">
                        No hay registros disponibles.
                    </td>
                  </tr>
                  
                  <!-- Loading State -->
                  <tr *ngIf="loading">
                    <td colspan="7" class="p-8 text-center text-[var(--muted)]">
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
                  <tr *ngFor="let stat of paginatedLeadersStats" class="group hover:bg-white/5 transition-colors">
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
                  
                  <tr *ngIf="paginatedLeadersStats.length === 0 && !loadingStats">
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

            <!-- Leader Pagination Footer -->
            <div *ngIf="leadersStats.length > 0" class="p-2 border-t border-[var(--border)] flex items-center justify-between">
                <span class="text-[10px] font-mono text-[var(--muted)]">
                    Pág {{ leaderPage }} / {{ leaderTotalPages }}
                </span>
                <div class="flex space-x-1">
                    <app-ui-button 
                        variant="outline" 
                        size="xs"
                        [disabled]="leaderPage === 1"
                        (onClick)="changeLeaderPage(leaderPage - 1)">
                        <span class="text-[10px]">Prev</span>
                    </app-ui-button>
                    <app-ui-button 
                        variant="outline" 
                        size="xs"
                        [disabled]="leaderPage === leaderTotalPages"
                        (onClick)="changeLeaderPage(leaderPage + 1)">
                        <span class="text-[10px]">Next</span>
                    </app-ui-button>
                </div>
            </div>
          </app-ui-card>
        </div>
      </div>

      <!-- Report Selection Modal -->
      <div *ngIf="isReportModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-md p-6 space-y-6 shadow-2xl animate-fade-in relative">
          <button (click)="isReportModalOpen = false" class="absolute top-4 right-4 text-[var(--muted)] hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div>
            <h3 class="text-xl font-display font-medium text-white mb-1">GENERAR REPORTE (LÍDER)</h3>
            <p class="text-[var(--muted)] text-sm font-mono">Seleccione el líder para filtrar el reporte electoral.</p>
          </div>

          <div class="space-y-4">
            <app-ui-select
              label="SELECCIONAR LÍDER"
              [options]="leaderOptions"
              [(ngModel)]="selectedLeaderId"
              placeholder="TODOS LOS LÍDERES"
              [searchable]="true"
            ></app-ui-select>

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
      <div *ngIf="isChiefReportModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
            <app-ui-select
              label="SELECCIONAR JEFE"
              [options]="chiefOptions"
              [(ngModel)]="selectedChiefId"
              placeholder="TODOS LOS JEFES"
              [searchable]="true"
            ></app-ui-select>

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

      <!-- Fixed Tooltip Portal -->
      <div *ngIf="hoveredVoter" 
           class="fixed z-[100] w-64 bg-[#0f172a] border border-[var(--primary)]/30 text-xs text-white p-3 rounded-[var(--radius-sm)] shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-none transition-opacity duration-150 animate-fade-in"
           [style.top.px]="tooltipPosition.top"
           [style.left.px]="tooltipPosition.left">
          
          <!-- Detail Tooltip (Voting Center) -->
          <ng-container *ngIf="tooltipType === 'detail' && hoveredVoter.detail">
              <div class="font-bold mb-2 text-[var(--primary)] uppercase tracking-wide border-b border-white/10 pb-1">
                  {{ hoveredVoter.detail.polling_station }}
              </div>
              
              <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                  <span class="text-[var(--muted)]">Mesa:</span> 
                  <span class="text-white font-mono">{{ hoveredVoter.detail.table }}</span>
                  
                  <span class="text-[var(--muted)]">Municipio:</span> 
                  <span class="text-white">{{ hoveredVoter.detail.municipality }}</span>
                  
                  <span class="text-[var(--muted)]">Depto:</span> 
                  <span class="text-white">{{ hoveredVoter.detail.department }}</span>
                  
                  <span class="text-[var(--muted)]">Dirección:</span> 
                  <span class="text-white truncate">{{ hoveredVoter.detail.address }}</span>
              </div>
          </ng-container>

          <!-- Status Tooltip (Verification Log) -->
          <ng-container *ngIf="tooltipType === 'status'">
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
          </ng-container>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  voterService = inject(VoterService);
  chiefService = inject(ChiefService);
  stats: DashboardStats | null = null;
  realStats: RealDashboardStats | null = null; // New property
  digitatorsStats: DigitadorStats[] = []; // New property
  leadersStats: LeaderStats[] = []; // New property
  chiefsStats: ChiefStats[] = [];

  // Leader selection for report
  leaderOptions: { value: any, label: string }[] = [];
  selectedLeaderId: string | null = null;
  isReportModalOpen: boolean = false;

  // Chief selection for report
  chiefOptions: { value: any, label: string }[] = [];
  selectedChiefId: string | null = null;
  isChiefReportModalOpen: boolean = false;

  generatingReport: boolean = false;

  // Chart Data
  statusChartData: number[] = [];
  statusChartLabels: string[] = ['Éxito', 'Espera', 'Fallo', 'Error'];
  statusChartColors: string[] = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

  chiefChartData: any[] = [];
  chiefChartLabels: string[] = [];
  chiefChartColors: string[] = ['#3b82f6', '#f43f5e']; // blue for leaders, rose for voters

  // Tooltip State
  hoveredVoter: Voter | null = null;
  tooltipPosition = { top: 0, left: 0 };
  tooltipType: 'detail' | 'status' = 'detail';

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

  // Leader Pagination State
  leaderPage: number = 1;
  leaderLimit: number = 10;
  leaderTotalPages: number = 1;

  get paginatedLeadersStats(): LeaderStats[] {
    const start = (this.leaderPage - 1) * this.leaderLimit;
    const end = start + this.leaderLimit;
    return this.leadersStats.slice(start, end);
  }

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
      leaders: this.voterService.getLeadersStats(),
      chiefs: this.chiefService.getStats(),
      leadersList: this.voterService.getLeaders(),
      chiefsList: this.chiefService.findAll()
    };

    forkJoin(requests)
      .pipe(finalize(() => this.loadingStats = false))
      .subscribe({
        next: (results) => {
          this.stats = results.stats;
          this.realStats = results.dashboard;
          this.digitatorsStats = results.digitators;
          this.leadersStats = results.leaders;
          this.leaderTotalPages = Math.ceil(this.leadersStats.length / this.leaderLimit) || 1;
          this.leaderPage = 1; // Reset to first page on refresh
          this.chiefsStats = results.chiefs.data || [];

          // Map leaders to options
          const list = results.leadersList || [];
          this.leaderOptions = [
            { value: null, label: 'TODOS LOS LÍDERES' },
            ...list.map(l => ({ value: l.id, label: l.nombre }))
          ];

          // Map chiefs to options
          const cList = results.chiefsList || [];
          this.chiefOptions = [
            { value: null, label: 'TODOS LOS JEFES' },
            ...cList.map(c => ({ value: c.id, label: c.nombre }))
          ];

          // Update doughnut chart data
          this.statusChartData = [
            results.dashboard.success || 0,
            results.dashboard.pending || 0,
            results.dashboard.failed || 0,
            results.dashboard.error || 0
          ];

          // Update chief bar chart data (Grouped datasets)
          const rawData = results.chiefs?.data || (Array.isArray(results.chiefs) ? results.chiefs : []);
          this.chiefsStats = rawData;

          if (this.chiefsStats.length > 0) {
            this.chiefChartLabels = this.chiefsStats.map(c => c.nombre || 'Sin nombre');
            this.chiefChartData = [
              {
                label: 'Líderes',
                data: this.chiefsStats.map(c => Number(c.totalLeaders || c.totalleaders || 0))
              },
              {
                label: 'Votantes',
                data: this.chiefsStats.map(c => Number(c.totalVoters || c.totalvoters || 0))
              }
            ];
          } else {
            this.chiefChartLabels = [];
            this.chiefChartData = [];
          }
        },
        error: (err) => console.error('Failed to refresh data', err)
      });
  }

  downloadReport() {
    this.voterService.getReport().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_general_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => console.error('Failed to download general report', err)
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
          const selected = this.leaderOptions.find(o => o.value === this.selectedLeaderId);
          if (selected) leaderName = selected.label.replace(/\s+/g, '_').toUpperCase();
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
          const selected = this.chiefOptions.find(o => o.value === this.selectedChiefId);
          if (selected) chiefName = selected.label.replace(/\s+/g, '_').toUpperCase();
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

  changeLimit(newLimit: number) {
    this.limit = newLimit;
    this.page = 1; // Reset to first page
    this.loadVoters();
  }

  changeLeaderPage(newPage: number) {
    if (newPage >= 1 && newPage <= this.leaderTotalPages) {
      this.leaderPage = newPage;
    }
  }

  calculateProgress(value: number = 0, total: number = 0): number {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  showTooltip(event: MouseEvent, voter: Voter, type: 'detail' | 'status' = 'detail') {
    if (type === 'detail' && !voter.detail) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const tooltipHeight = type === 'detail' ? 140 : 100;
    const showBelow = rect.top < 150;

    this.hoveredVoter = voter;
    this.tooltipType = type;

    this.tooltipPosition = {
      left: rect.left + (rect.width / 2) - 128, // Center (256px width / 2)
      top: showBelow ? (rect.bottom + 10) : (rect.top - tooltipHeight - 10)
    };
  }

  hideTooltip() {
    this.hoveredVoter = null;
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'ERROR': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    }
  }
}
