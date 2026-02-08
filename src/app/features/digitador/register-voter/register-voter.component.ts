import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VoterService, Voter } from '../../../core/services/voter.service';
import { Leader } from '../../../core/models/leader.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent, SelectOption } from '../../../shared/components/ui-select/ui-select.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { MyRecordsComponent } from '../my-records/my-records.component';

@Component({
  selector: 'app-register-voter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiCardComponent, UiInputComponent, UiSelectComponent, UiButtonComponent, MyRecordsComponent],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Registration Form -->
      <section>
        <div class="mb-6">
          <h2 class="text-2xl font-display font-medium text-white tracking-tight">REGISTRO DE VOTANTES</h2>
          <p class="text-[var(--muted)] text-sm">Ingrese los detalles del votante con precisión. Todos los campos son obligatorios.</p>
        </div>

        <app-ui-card>
          <form [formGroup]="voterForm" (ngSubmit)="onSubmit()">
            <!-- ID / Cedula -->
            <app-ui-input 
              label="CÉDULA (ID)" 
              placeholder="No. Identificación" 
              formControlName="cedula"
              [required]="true"
              [error]="getErrorMessage('cedula')"
            ></app-ui-input>

            <!-- Nombre -->
            <app-ui-input 
              label="NOMBRE COMPLETO" 
              placeholder="Nombres y Apellidos" 
              formControlName="nombre"
              [required]="true"
              [error]="getErrorMessage('nombre')"
            ></app-ui-input>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Telefono -->
              <app-ui-input 
                label="TELÉFONO" 
                placeholder="Número Celular" 
                formControlName="telefono"
                [required]="true"
                [error]="getErrorMessage('telefono')"
              ></app-ui-input>

              <!-- Leader Select -->
               <app-ui-select 
                label="LÍDER ASIGNADO" 
                placeholder="Seleccione un Líder" 
                formControlName="leader_id"
                [options]="leaderOptions()"
                [required]="true"
                [error]="getErrorMessage('leader_id')"
              ></app-ui-select>
            </div>

            <div class="mt-8 flex justify-end space-x-4">
              <app-ui-button variant="outline" type="button" (onClick)="onReset()">LIMPIAR FORMULARIO</app-ui-button>
              <app-ui-button variant="secondary" type="submit" [loading]="loading">REGISTRAR VOTANTE</app-ui-button>
            </div>
            
            <div *ngIf="successMessage" class="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[var(--radius-sm)] text-emerald-400 text-xs font-mono text-center animate-pulse">
              {{ successMessage }}
            </div>
            
             <div *ngIf="errorMessage" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] text-red-400 text-xs font-mono text-center">
              {{ errorMessage }}
            </div>
          </form>
        </app-ui-card>
      </section>

      <!-- Divider -->
      <div class="border-t border-[var(--border)]"></div>

      <!-- My Records Table -->
      <section>
        <app-my-records #recordsTable></app-my-records>
      </section>
    </div>
  `
})
export class RegisterVoterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private voterService = inject(VoterService);

  @ViewChild('recordsTable') recordsTable!: MyRecordsComponent;

  leaders = signal<Leader[]>([]);
  leaderOptions = signal<SelectOption[]>([]);

  voterForm = this.fb.group({
    cedula: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(6)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    leader_id: ['', [Validators.required]]
  });

  loading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadLeaders();
  }

  loadLeaders() {
    this.voterService.getLeaders().subscribe({
      next: (data) => {
        this.leaders.set(data);
        const options = data.map(l => ({ label: l.nombre, value: l.id }));
        this.leaderOptions.set(options);
      },
      error: (err) => {
        console.error('Failed to load leaders', err);
        this.errorMessage = 'Error cargando lista de líderes';
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.voterForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es obligatorio';
    if (control?.hasError('minlength')) return `Longitud mínima es ${control.errors?.['minlength'].requiredLength}`;
    if (control?.hasError('pattern')) return 'Formato inválido (solo números)';
    return '';
  }

  onSubmit() {
    if (this.voterForm.valid) {
      this.loading = true;
      this.successMessage = '';
      this.errorMessage = '';

      // Clean payload
      const formValue = this.voterForm.value;
      const payload: Partial<Voter> = {
        cedula: formValue.cedula!,
        nombre: formValue.nombre!,
        telefono: formValue.telefono!,
        leader_id: formValue.leader_id!
      };

      this.voterService.registerVoter(payload).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'REGISTRO DE VOTANTE EXITOSO - DATOS ENCRIPTADOS Y REGISTRADOS';
          this.voterForm.reset({
            cedula: '',
            nombre: '',
            telefono: '',
            leader_id: ''
          });
          this.recordsTable.loadRecords(); // Refresh table
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.message || 'Error al registrar votante. Verifique la conexión.';
          console.error(err);
        }
      });
    } else {
      this.voterForm.markAllAsTouched();
    }
  }

  onReset() {
    this.voterForm.reset({
      cedula: '',
      nombre: '',
      telefono: '',
      leader_id: ''
    });
  }
}
