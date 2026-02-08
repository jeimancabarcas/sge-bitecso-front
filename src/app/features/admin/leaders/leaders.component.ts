import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaderService } from '../../../core/services/leader.service';
import { ChiefService } from '../../../core/services/chief.service';
import { Leader } from '../../../core/models/leader.model';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent, SelectOption } from '../../../shared/components/ui-select/ui-select.component';

@Component({
  selector: 'app-leaders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiInputComponent, UiSelectComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-display font-medium text-white tracking-tight">GESTIÓN DE LÍDERES</h2>
        <app-ui-button variant="primary" (onClick)="openModal()">NUEVO LÍDER</app-ui-button>
      </div>

      <!-- Top Level Error Message -->
      <div *ngIf="topErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] text-red-400 text-xs font-mono flex justify-between items-center animate-fade-in">
         <span>{{ topErrorMessage }}</span>
         <button (click)="topErrorMessage = null" class="text-white/50 hover:text-white">&times;</button>
      </div>

      <!-- Table -->
      <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-white/5 border-b border-[var(--border)]">
              <tr>
                <th class="px-6 py-3 font-medium text-[var(--muted)]">Cédula</th>
                <th class="px-6 py-3 font-medium text-[var(--muted)]">Nombre</th>
                <th class="px-6 py-3 font-medium text-[var(--muted)]">Teléfono</th>
                <th class="px-6 py-3 font-medium text-[var(--muted)]">Jefe</th>
                <th class="px-6 py-3 font-medium text-[var(--muted)] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border)]">
              <tr *ngFor="let leader of leaders()" class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-3 text-white font-mono">{{ leader.cedula }}</td>
                <td class="px-6 py-3 text-white">{{ leader.nombre }}</td>
                <td class="px-6 py-3 text-[var(--muted)] font-mono">{{ leader.telefono }}</td>
                <td class="px-6 py-3 text-[var(--muted)]">{{ leader.chief?.nombre || '-' }}</td>
                <td class="px-6 py-3 text-right space-x-2">
                  <button (click)="editLeader(leader)" class="text-[var(--primary)] hover:underline">Editar</button>
                  <button (click)="deleteLeader(leader.id)" class="text-red-400 hover:underline">Eliminar</button>
                </td>
              </tr>
              <tr *ngIf="leaders().length === 0">
                 <td colspan="5" class="px-6 py-8 text-center text-[var(--muted)]">
                    No hay líderes registrados.
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-md p-6 space-y-4 shadow-2xl">
          <h3 class="text-xl font-display font-medium text-white">{{ isEditing ? 'Editar Líder' : 'Nuevo Líder' }}</h3>
          
          <div *ngIf="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] text-red-400 text-xs font-mono">
             {{ errorMessage }}
          </div>

          <form [formGroup]="leaderForm" (ngSubmit)="saveLeader()" class="space-y-4">
            <app-ui-input 
                label="Cédula" 
                placeholder="Ej: 1234567890" 
                formControlName="cedula"
            ></app-ui-input>
            
            <app-ui-input 
                label="Nombre Completo" 
                placeholder="Ej: Juan Pérez" 
                formControlName="nombre"
            ></app-ui-input>

            <app-ui-input 
                label="Teléfono" 
                placeholder="Ej: 3001234567" 
                formControlName="telefono"
            ></app-ui-input>

            <app-ui-select 
                label="Jefe Asignado" 
                placeholder="Seleccione un Jefe" 
                formControlName="chief_id"
                [options]="chiefOptions()"
                [required]="true"
            ></app-ui-select>

            <div class="flex justify-end space-x-3 mt-6">
              <app-ui-button variant="outline" (onClick)="closeModal()" type="button">CANCELAR</app-ui-button>
              <app-ui-button variant="primary" type="submit" [loading]="isSaving">GUARDAR</app-ui-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LeadersComponent {
  private leaderService = inject(LeaderService);
  private chiefService = inject(ChiefService);
  private fb = inject(FormBuilder);

  leaders = signal<Leader[]>([]);
  chiefOptions = signal<SelectOption[]>([]);
  isModalOpen = false;
  isEditing = false;
  isSaving = false;
  editingId: string | null = null;
  errorMessage: string | null = null;
  topErrorMessage: string | null = null;

  leaderForm: FormGroup = this.fb.group({
    cedula: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    chief_id: ['', [Validators.required]]
  });

  constructor() {
    this.loadLeaders();
    this.loadChiefs();
  }

  loadChiefs() {
    this.chiefService.findAll().subscribe({
      next: (data) => {
        const options = data.map(c => ({ label: c.nombre, value: c.id }));
        this.chiefOptions.set(options);
      },
      error: (err) => console.error('Error loading chiefs', err)
    });
  }

  loadLeaders() {
    this.leaderService.findAll().subscribe({
      next: (data) => this.leaders.set(data),
      error: (err) => console.error('Error loading leaders', err)
    });
  }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    this.leaderForm.reset();
    this.errorMessage = null;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.errorMessage = null;
  }

  editLeader(leader: Leader) {
    this.isEditing = true;
    this.editingId = leader.id;
    this.leaderForm.patchValue({
      cedula: leader.cedula,
      nombre: leader.nombre,
      telefono: leader.telefono,
      chief_id: leader.chief_id
    });
    this.errorMessage = null;
    this.isModalOpen = true;
  }

  saveLeader() {
    if (this.leaderForm.invalid) return;

    this.isSaving = true;
    const formData = this.leaderForm.value;

    const request = this.isEditing && this.editingId
      ? this.leaderService.update(this.editingId, formData)
      : this.leaderService.create(formData);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadLeaders();
      },
      error: (err) => {
        console.error('Error saving leader', err);
        this.errorMessage = err.message || 'Error al procesar la solicitud';
        this.isSaving = false;
      }
    });
  }

  deleteLeader(id: string) {
    if (!confirm('¿Estás seguro de eliminar este líder?')) return;

    this.topErrorMessage = null;
    this.leaderService.remove(id).subscribe({
      next: () => this.loadLeaders(),
      error: (err) => {
        this.topErrorMessage = err.message || 'Error al eliminar líder';
        console.error('Error deleting leader', err);
      }
    });
  }
}
