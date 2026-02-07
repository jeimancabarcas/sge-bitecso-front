import { Component, Input, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mb-4">
      <label *ngIf="label" class="block text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1.5 ml-0.5">
        {{ label }} <span *ngIf="required" class="text-[var(--secondary)]">*</span>
      </label>
      <div class="relative group">
        <input
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          (input)="onInput($any($event.target).value)"
          (blur)="onTouched()"
          class="block w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] 
                 text-[var(--foreground)] placeholder-[var(--muted)] 
                 focus:outline-none focus:border-[var(--primary)] focus:ring-[1px] focus:ring-[var(--primary)] 
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-150"
          [ngClass]="{'border-red-500 focus:border-red-500 focus:ring-red-500': invalid}"
        />
        <!-- Tech Accent Line -->
        <div class="absolute bottom-0 left-0 h-[2px] bg-[var(--primary)] w-0 transition-all duration-300 group-focus-within:w-full"></div>
      </div>
      <div *ngIf="invalid && error" class="mt-1 text-xs text-red-500 font-medium">
        {{ error }}
      </div>
    </div>
  `
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() error: string = '';

  value: string = '';
  disabled: boolean = false;

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get invalid(): boolean {
    return !!(this.ngControl?.invalid && this.ngControl?.touched);
  }

  onChange = (value: string) => { };
  onTouched = () => { };

  onInput(value: string) {
    this.value = value;
    this.onChange(value);
  }

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
