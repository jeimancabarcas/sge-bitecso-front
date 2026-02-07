import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiInputComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-display font-medium text-white tracking-tight">GESTIÓN DE DIGITADORES</h2>
        <app-ui-button variant="primary" (onClick)="openModal()">NUEVO USUARIO</app-ui-button>
      </div>

      <!-- Table -->
      <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-white/5 border-b border-[var(--border)]">
              <tr>
                <th class="px-6 py-3 font-medium text-[var(--muted)]">Usuario</th>
                <th class="px-6 py-3 font-medium text-[var(--muted)]">Nombre Completo</th>
                <th class="px-6 py-3 font-medium text-[var(--muted)]">Rol</th>
                <th class="px-6 py-3 font-medium text-[var(--muted)] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border)]">
              <tr *ngFor="let user of users()" class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-3 text-white font-mono">{{ user.username }}</td>
                <td class="px-6 py-3 text-white">{{ user.fullName || user.nombre || '-' }}</td>
                <td class="px-6 py-3">
                  <span class="px-2 py-1 text-xs font-medium rounded-full" 
                        [ngClass]="user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'">
                    {{ user.role | uppercase }}
                  </span>
                </td>
                <td class="px-6 py-3 text-right space-x-2">
                  <button (click)="editUser(user)" class="text-[var(--primary)] hover:underline">Editar</button>
                  <button (click)="deleteUser(user.id.toString())" class="text-red-400 hover:underline">Eliminar</button>
                </td>
              </tr>
              <tr *ngIf="users().length === 0">
                 <td colspan="4" class="px-6 py-8 text-center text-[var(--muted)]">
                    No hay usuarios registrados.
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-md p-6 space-y-4 shadow-2xl">
          <h3 class="text-xl font-display font-medium text-white">{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          
          <div *ngIf="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] text-red-400 text-xs font-mono">
             {{ errorMessage }}
          </div>

          <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="space-y-4">
            
            <app-ui-input 
                label="Usuario" 
                placeholder="Ej: jdoe" 
                formControlName="username"
                [required]="true"
            ></app-ui-input>

            <app-ui-input 
                label="Nombre Completo" 
                placeholder="Ej: John Doe" 
                formControlName="fullName"
                [required]="true"
            ></app-ui-input>

            <app-ui-input 
                label="Contraseña" 
                type="password"
                placeholder="********" 
                formControlName="password"
                [required]="!isEditing"
            ></app-ui-input>
            <p *ngIf="isEditing" class="text-xs text-[var(--muted)] -mt-3 mb-2">Dejar en blanco para mantener la contraseña actual.</p>

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
export class UsersComponent {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  isModalOpen = false;
  isEditing = false;
  isSaving = false;
  editingId: string | null = null;
  errorMessage: string | null = null;

  userForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    fullName: ['', [Validators.required]],
    password: ['']
  });

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.findAll().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Error loading users', err)
    });
  }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.errorMessage = null;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.errorMessage = null;
  }

  editUser(user: User) {
    this.isEditing = true;
    this.editingId = user.id.toString();

    this.userForm.patchValue({
      username: user.username,
      fullName: user.fullName || user.nombre
    });

    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.errorMessage = null;

    this.isModalOpen = true;
  }

  saveUser() {
    if (this.userForm.invalid) return;

    this.isSaving = true;
    const formData = this.userForm.value;

    const request = this.isEditing && this.editingId
      ? this.userService.update(this.editingId, formData)
      : this.userService.create(formData);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error saving user', err);
        this.errorMessage = err.message || 'Error al procesar la solicitud';
        this.isSaving = false;
      }
    });
  }

  deleteUser(id: string) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    this.userService.remove(id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        alert(err.message || 'Error al eliminar usuario');
        console.error('Error deleting user', err);
      }
    });
  }
}
