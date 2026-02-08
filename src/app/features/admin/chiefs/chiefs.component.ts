import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChiefService } from '../../../core/services/chief.service';
import { Chief } from '../../../core/models/chief.model';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';

@Component({
    selector: 'app-chiefs',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiInputComponent],
    template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-display font-medium text-white tracking-tight">GESTIÓN DE JEFES</h2>
        <app-ui-button variant="primary" (onClick)="openModal()">NUEVO JEFE</app-ui-button>
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
                <th class="px-6 py-3 font-medium text-[var(--muted)] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border)]">
              <tr *ngFor="let chief of chiefs()" class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-3 text-white font-mono">{{ chief.cedula }}</td>
                <td class="px-6 py-3 text-white">{{ chief.nombre }}</td>
                <td class="px-6 py-3 text-[var(--muted)] font-mono">{{ chief.telefono || '-' }}</td>
                <td class="px-6 py-3 text-right space-x-2">
                  <button (click)="editChief(chief)" class="text-[var(--primary)] hover:underline">Editar</button>
                  <button (click)="deleteChief(chief.id)" class="text-red-400 hover:underline">Eliminar</button>
                </td>
              </tr>
              <tr *ngIf="chiefs().length === 0">
                 <td colspan="4" class="px-6 py-8 text-center text-[var(--muted)]">
                    No hay jefes registrados.
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-md p-6 space-y-4 shadow-2xl">
          <h3 class="text-xl font-display font-medium text-white">{{ isEditing ? 'Editar Jefe' : 'Nuevo Jefe' }}</h3>
          
          <div *ngIf="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] text-red-400 text-xs font-mono">
             {{ errorMessage }}
          </div>

          <form [formGroup]="chiefForm" (ngSubmit)="saveChief()" class="space-y-4">
            <app-ui-input 
                label="Nombre Completo" 
                placeholder="Ej: Roberto Jiménez" 
                formControlName="nombre"
                [required]="true"
            ></app-ui-input>

            <app-ui-input 
                label="Cédula" 
                placeholder="Ej: 12345678" 
                formControlName="cedula"
                [required]="true"
            ></app-ui-input>
            
            <app-ui-input 
                label="Teléfono (Opcional)" 
                placeholder="Ej: 3001234567" 
                formControlName="telefono"
            ></app-ui-input>

            <div class="flex justify-end space-x-3 mt-6">
              <app-ui-button variant="outline" (onClick)="closeModal()" type="button">CANCELAR</app-ui-button>
              <app-ui-button variant="primary" type="submit" [loading]="isSaving">GUARDAR</app-ui-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ChiefsComponent {
    private chiefService = inject(ChiefService);
    private fb = inject(FormBuilder);

    chiefs = signal<Chief[]>([]);
    isModalOpen = false;
    isEditing = false;
    isSaving = false;
    editingId: string | null = null;
    errorMessage: string | null = null;
    topErrorMessage: string | null = null;

    chiefForm: FormGroup = this.fb.group({
        nombre: ['', [Validators.required]],
        cedula: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
        telefono: ['', [Validators.pattern('^[0-9]{10}$')]]
    });

    constructor() {
        this.loadChiefs();
    }

    loadChiefs() {
        this.chiefService.findAll().subscribe({
            next: (data) => this.chiefs.set(data),
            error: (err) => {
                console.error('Error loading chiefs', err);
                this.topErrorMessage = err.message || 'Error al cargar jefes';
            }
        });
    }

    openModal() {
        this.isEditing = false;
        this.editingId = null;
        this.chiefForm.reset();
        this.errorMessage = null;
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.errorMessage = null;
    }

    editChief(chief: Chief) {
        this.isEditing = true;
        this.editingId = chief.id;
        this.chiefForm.patchValue({
            nombre: chief.nombre,
            cedula: chief.cedula,
            telefono: chief.telefono
        });
        this.errorMessage = null;
        this.isModalOpen = true;
    }

    saveChief() {
        if (this.chiefForm.invalid) return;

        this.isSaving = true;
        const formData = this.chiefForm.value;

        const request = this.isEditing && this.editingId
            ? this.chiefService.update(this.editingId, formData)
            : this.chiefService.create(formData);

        request.subscribe({
            next: () => {
                this.isSaving = false;
                this.closeModal();
                this.loadChiefs();
            },
            error: (err) => {
                console.error('Error saving chief', err);
                this.errorMessage = err.message || 'Error al procesar la solicitud';
                this.isSaving = false;
            }
        });
    }

    deleteChief(id: string) {
        if (!confirm('¿Estás seguro de eliminar este jefe?')) return;

        this.topErrorMessage = null;
        this.chiefService.remove(id).subscribe({
            next: () => this.loadChiefs(),
            error: (err) => {
                this.topErrorMessage = err.message || 'Error al eliminar jefe';
                console.error('Error deleting chief', err);
            }
        });
    }
}
