import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

@Component({
    selector: 'app-ui-button',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
      class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed"
      [ngClass]="{
        'bg-[var(--primary)] text-white hover:bg-blue-600 focus:ring-[var(--primary)] shadow-[0_0_15px_rgba(59,130,246,0.3)]': variant === 'primary',
        'bg-[var(--secondary)] text-black hover:bg-amber-400 focus:ring-[var(--secondary)]': variant === 'secondary',
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
        'border border-[var(--border)] text-[var(--foreground)] hover:bg-white/5 focus:ring-white/20': variant === 'outline',
        'text-[var(--muted)] hover:text-white hover:bg-white/5': variant === 'ghost',
        'w-full': fullWidth,
        'rounded-[var(--radius-sm)]': true
      }"
    >
      <span *ngIf="loading" class="mr-2 animate-spin">
        <svg class="h-4 w-4" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
      <ng-content></ng-content>
    </button>
  `
})
export class UiButtonComponent {
    @Input() variant: ButtonVariant = 'primary';
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() disabled: boolean = false;
    @Input() loading: boolean = false;
    @Input() fullWidth: boolean = false;
    @Output() onClick = new EventEmitter<MouseEvent>();
}
