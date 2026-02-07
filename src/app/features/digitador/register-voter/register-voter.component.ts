import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VoterService, Voter } from '../../../core/services/voter.service';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-register-voter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiCardComponent, UiInputComponent, UiButtonComponent],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="mb-6">
        <h2 class="text-2xl font-display font-medium text-white tracking-tight">VOTER INTAKE</h2>
        <p class="text-[var(--muted)] text-sm">Enter voter details accurately. All fields are mandatory.</p>
      </div>

      <app-ui-card>
        <form [formGroup]="voterForm" (ngSubmit)="onSubmit()">
          <!-- ID / Cedula -->
          <app-ui-input 
            label="CEDULA (ID)" 
            placeholder="No. Identificacion" 
            formControlName="cedula"
            [required]="true"
            [error]="getErrorMessage('cedula')"
          ></app-ui-input>

          <!-- Nombre -->
          <app-ui-input 
            label="FULL NAME" 
            placeholder="Nombres y Apellidos" 
            formControlName="nombre"
            [required]="true"
            [error]="getErrorMessage('nombre')"
          ></app-ui-input>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Telefono -->
            <app-ui-input 
              label="PHONE" 
              placeholder="Numero Celular" 
              formControlName="telefono"
              [required]="true"
              [error]="getErrorMessage('telefono')"
            ></app-ui-input>

            <!-- Mesa (Usually auto-assigned or strict input) -->
             <app-ui-input 
              label="TABLE ASSIGNMENT" 
              placeholder="No. Mesa" 
              formControlName="mesa"
              [required]="true"
              type="number"
              [error]="getErrorMessage('mesa')"
            ></app-ui-input>
          </div>

          <div class="mt-8 flex justify-end space-x-4">
            <app-ui-button variant="outline" type="button" (onClick)="onReset()">CLEAR FORM</app-ui-button>
            <app-ui-button variant="secondary" type="submit" [loading]="loading">REGISTER VOTER</app-ui-button>
          </div>
          
          <div *ngIf="successMessage" class="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[var(--radius-sm)] text-emerald-400 text-xs font-mono text-center animate-pulse">
            {{ successMessage }}
          </div>
        </form>
      </app-ui-card>
    </div>
  `
})
export class RegisterVoterComponent {
  private fb = inject(FormBuilder);
  private voterService = inject(VoterService);

  voterForm = this.fb.group({
    cedula: ['', [Validators.required, Validators.minLength(6)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    mesa: ['', [Validators.required]]
  });

  loading = false;
  successMessage = '';

  getErrorMessage(controlName: string): string {
    const control = this.voterForm.get(controlName);
    if (control?.hasError('required')) return 'This field is required';
    if (control?.hasError('minlength')) return `Minimum length is ${control.errors?.['minlength'].requiredLength}`;
    if (control?.hasError('pattern')) return 'Invalid format (numbers only)';
    return '';
  }

  onSubmit() {
    if (this.voterForm.valid) {
      this.loading = true;
      this.successMessage = '';

      this.voterService.registerVoter(this.voterForm.value as unknown as Partial<Voter>).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'VOTER REGISTRATION SUCCESSFUL - DATA ENCRYPTED & LOGGED';
          this.voterForm.reset();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => {
          this.loading = false;
          // Handle error
        }
      });
    } else {
      this.voterForm.markAllAsTouched();
    }
  }

  onReset() {
    this.voterForm.reset();
  }
}
