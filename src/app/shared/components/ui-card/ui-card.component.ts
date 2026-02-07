import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-ui-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card-glass p-4 h-full relative group">
      <div *ngIf="title" class="mb-3 flex justify-between items-center border-b border-white/5 pb-2">
        <h3 class="text-white font-display font-medium tracking-tight text-lg">{{ title }}</h3>
        <ng-content select="[header-action]"></ng-content>
      </div>
      <div class="text-[var(--muted)] text-sm">
        <ng-content></ng-content>
      </div>
      
      <!-- War Room Corner Accent -->
      <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--primary)] opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--primary)] opacity-50 group-hover:opacity-100 transition-opacity"></div>
    </div>
  `
})
export class UiCardComponent {
    @Input() title: string = '';
}
