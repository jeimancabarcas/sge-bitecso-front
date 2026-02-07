import { Component, Input, Optional, Self, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
    label: string;
    value: any;
}

@Component({
    selector: 'app-ui-select',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="mb-4 relative">
      <!-- Label -->
      <label *ngIf="label" class="block text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1.5 ml-0.5">
        {{ label }} <span *ngIf="required" class="text-[var(--secondary)]">*</span>
      </label>
      
      <!-- Combobox Container -->
      <div class="relative group">
        
        <!-- Main Input (Display) -->
        <div 
            (click)="toggleDropdown()"
            class="flex items-center justify-between w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] 
                   cursor-pointer transition-all duration-150"
            [ngClass]="{
                'border-red-500 hover:border-red-500': invalid, 
                'ring-[1px] ring-[var(--primary)] border-[var(--primary)]': isOpen
            }"
        >
            <span [class.text-[var(--muted)]]="!selectedLabel" [class.text-[var(--foreground)]]="selectedLabel">
                {{ selectedLabel || placeholder }}
            </span>

            <!-- Arrow Icon -->
            <svg class="w-4 h-4 text-[var(--muted)] transition-transform duration-200" [class.rotate-180]="isOpen" viewBox="0 0 20 20" fill="currentColor">
                 <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        </div>

        <!-- Tech Accent Line -->
        <div class="absolute bottom-0 left-0 h-[2px] bg-[var(--primary)] w-0 transition-all duration-300" [class.w-full]="isOpen"></div>

        <!-- Dropdown Menu -->
        <div *ngIf="isOpen" class="absolute z-50 w-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            <!-- Search Input -->
            <div class="p-2 border-b border-[var(--border)]">
                <input 
                    type="text" 
                    [placeholder]="'Buscar...'" 
                    class="w-full bg-[var(--background)] text-[var(--foreground)] text-sm px-2 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                    (input)="onSearch($any($event.target).value)"
                    (click)="$event.stopPropagation()"
                    #searchInput
                >
            </div>

            <!-- Options List -->
            <ul class="max-h-60 overflow-auto py-1 custom-scrollbar">
                <li *ngFor="let option of filteredOptions()" 
                    (click)="selectOption(option)"
                    class="px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] cursor-pointer transition-colors"
                    [class.bg-[var(--primary)]/20]="option.value === value"
                    [class.text-[var(--primary)]]="option.value === value"
                >
                    {{ option.label }}
                </li>
                
                <li *ngIf="filteredOptions().length === 0" class="px-3 py-2 text-sm text-[var(--muted)] text-center italic">
                    No se encontraron resultados
                </li>
            </ul>
        </div>

      </div>

      <!-- Error Message -->
      <div *ngIf="invalid && error" class="mt-1 text-xs text-red-500 font-medium">
        {{ error }}
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--muted); }
  `]
})
export class UiSelectComponent implements ControlValueAccessor {
    @Input() label: string = '';
    @Input() placeholder: string = 'Seleccione una opción';

    // Inputs must be signals or handled with backing fields to react effectively
    private _options: SelectOption[] = [];
    @Input()
    set options(v: SelectOption[]) {
        this._options = v;
        this.filterQuery.set(''); // Reset filter on new options
    }
    get options() { return this._options; }

    @Input() required: boolean = false;
    @Input() error: string = '';

    value: any = '';
    disabled: boolean = false;
    isOpen: boolean = false;

    // Signals for filtering
    filterQuery = signal('');

    // Computed filtered options
    filteredOptions = computed(() => {
        const query = this.filterQuery().toLowerCase();
        if (!query) return this.options;
        return this.options.filter(opt => opt.label.toLowerCase().includes(query));
    });

    // Helper to get selected label
    get selectedLabel(): string {
        const selected = this.options.find(opt => opt.value === this.value);
        return selected ? selected.label : '';
    }

    constructor(
        @Optional() @Self() public ngControl: NgControl,
        private elementRef: ElementRef
    ) {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    // Close dropdown on click outside
    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    toggleDropdown() {
        if (this.disabled) return;
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            // Focus search input on open (timeout to wait for render)
            setTimeout(() => {
                this.elementRef.nativeElement.querySelector('input')?.focus();
            }, 50);
        } else {
            this.onTouched();
        }
    }

    onSearch(query: string) {
        this.filterQuery.set(query);
    }

    selectOption(option: SelectOption) {
        this.value = option.value;
        this.onChange(this.value);
        this.onTouched();
        this.isOpen = false;
        this.filterQuery.set(''); // Reset search
    }

    // ControlValueAccessor methods
    get invalid(): boolean {
        return !!(this.ngControl?.invalid && this.ngControl?.touched);
    }

    onChange = (value: any) => { };
    onTouched = () => { };

    writeValue(value: any): void {
        this.value = value;
        this.filterQuery.set(''); // Reset search on any value change from parent (e.g. reset)
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
