import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoterService, DashboardStats } from '../../../core/services/voter.service';
import { UiStatTileComponent } from '../../../shared/components/ui-stat-tile/ui-stat-tile.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, UiStatTileComponent, UiCardComponent, UiButtonComponent],
    template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-display font-medium text-white tracking-tight">ESTADO DE LA MISIÓN</h2>
        <div class="flex space-x-3">
           <app-ui-button variant="outline" (onClick)="refresh()">ACTUALIZAR DATOS</app-ui-button>
           <app-ui-button variant="primary">GENERAR REPORTE</app-ui-button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-ui-stat-tile 
          label="Total Registrados" 
          [value]="stats?.totalRegistered || 0" 
          [trend]="12" 
          [progress]="75">
        </app-ui-stat-tile>
        
        <app-ui-stat-tile 
          label="Mesas Activas" 
          [value]="stats?.byMesa?.length || 0" 
          [trend]="0" 
          [progress]="100">
        </app-ui-stat-tile>
        
        <app-ui-stat-tile 
          label="Velocidad de Datos" 
          value="240/hr" 
          [trend]="5" 
          [progress]="60">
        </app-ui-stat-tile>
        
        <app-ui-stat-tile 
          label="Salud del Sistema" 
          value="98%" 
          [trend]="0" 
          [progress]="98">
        </app-ui-stat-tile>
      </div>

      <!-- Main Data Area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Voter Table (2/3 width) -->
        <div class="lg:col-span-2">
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
                  <tr *ngFor="let voter of stats?.recentActivity" class="group hover:bg-white/5 transition-colors">
                    <td class="p-3 font-mono text-white">{{ voter.cedula }}</td>
                    <td class="p-3 text-[var(--foreground)]">{{ voter.nombre }}</td>
                    <td class="p-3">
                      <span class="badge-success">Mesa {{ voter.mesa }}</span>
                    </td>
                    <td class="p-3 text-sm text-[var(--muted)]">{{ voter.digitador }}</td>
                    <td class="p-3 text-xs font-mono text-[var(--muted)]">
                      {{ voter.fechaRegistro | date:'HH:mm:ss' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </app-ui-card>
        </div>

        <!-- Table Distribution (1/3 width) -->
        <div>
          <app-ui-card title="DISTRIBUCIÓN POR MESA">
            <div class="space-y-4">
              <div *ngFor="let m of stats?.byMesa" class="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-mono text-[var(--muted)] mr-3">
                    {{ m.mesa }}
                  </div>
                  <span class="text-sm font-medium text-[var(--foreground)]">Mesa {{ m.mesa }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-24 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div class="h-full bg-[var(--secondary)]" [style.width.%]="(m.count / 1000) * 100"></div>
                  </div>
                  <span class="text-xs font-mono text-[var(--primary)]">{{ m.count }}</span>
                </div>
              </div>
            </div>
          </app-ui-card>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    voterService = inject(VoterService);
    stats: DashboardStats | null = null;

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.voterService.getStats().subscribe((data: DashboardStats) => {
            this.stats = data;
        });
    }
}
