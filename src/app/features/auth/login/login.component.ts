import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiCardComponent, UiInputComponent, UiButtonComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--background)]">
      <!-- Background Grid/Effects -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      
      <div class="w-full max-w-md p-4 relative z-10">
        <div class="mb-8 text-center">
          <h1 class="text-4xl font-display font-medium tracking-tight text-white mb-2">SGE BITECSO</h1>
          <p class="text-[var(--primary)] font-mono text-sm uppercase tracking-[0.2em]">Command Center Access</p>
        </div>
        
        <app-ui-card>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <app-ui-input 
              label="USERNAME" 
              placeholder="Enter your username" 
              formControlName="username"
              [error]="'Username is required'"
            ></app-ui-input>

            <div class="mt-4">
               <app-ui-input 
                label="PASSWORD" 
                placeholder="Enter your password" 
                type="password"
                formControlName="password"
                [error]="'Password is required'"
              ></app-ui-input>
            </div>
            
            <div class="mt-6">
              <app-ui-button type="submit" [loading]="loading" [fullWidth]="true" variant="primary">
                AUTHENTICATE
              </app-ui-button>
            </div>

            <div *ngIf="error" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] text-red-400 text-xs font-mono text-center">
              {{ error }}
            </div>
          </form>
        </app-ui-card>
        
        <div class="mt-8 text-center text-[var(--muted)] text-xs font-mono">
          SECURE CONNECTION ESTABLISHED
          <br>
          v1.0.0-alpha
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';
      const { username, password } = this.loginForm.value;

      if (username && password) {
        this.authService.login(username, password).subscribe({
          next: (res) => {
            this.loading = false;
            // Redirect based on role
            if (res.user.role === 'admin') {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigate(['/digitador/register']);
            }
          },
          error: (err) => {
            this.loading = false;
            this.error = 'ACCESS DENIED: Invalid Credentials';
          }
        });
      }
    }
  }
}
