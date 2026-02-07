import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../ui-card/ui-card.component';

@Component({
    selector: 'app-ui-stat-tile',
    standalone: true,
    imports: [CommonModule, UiCardComponent],
    template: `
    <app-ui-card>
      <div class="flex flex-col h-full justify-between">
        <div class="text-[var(--muted)] text-xs uppercase tracking-wider font-mono mb-2">
          {{ label }}
        </div>
        <div class="flex items-end justify-between">
          <div class="text-4xl font-display font-medium text-white tracking-tight">
            {{ value }}
          </div>
          <div *ngIf="trend" class="text-xs font-mono mb-1" [ngClass]="{
            'text-emerald-400': trend > 0,
            'text-red-400': trend < 0,
            'text-[var(--muted)]': trend === 0
          }">
            {{ trend > 0 ? '+' : '' }}{{ trend }}%
          </div>
        </div>
        
        <!-- Decoration -->
        <div class="w-full h-1 bg-white/5 mt-4 rounded-full overflow-hidden">
          <div class="h-full bg-[var(--primary)]" [style.width.%]="progress || 0"></div>
        </div>
      </div>
    </app-ui-card>
  `
})
export class UiStatTileComponent {
    @Input() label: string = '';
    @Input() value: string | number = 0;
    @Input() trend: number = 0;
    @Input() progress: number = 0;
}
