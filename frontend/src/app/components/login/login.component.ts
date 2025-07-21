import { Component } from '@angular/core';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData: LoginRequest = {
    username: '',
    password: ''
  };
  
  loading = false;
  errorMessage = '';
  showModal = false;

  constructor(private authService: AuthService) {}

  openModal(): void {
    this.showModal = true;
    this.resetForm();
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  onSubmit(): void {
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          console.log('Login exitoso:', response.user);
          this.closeModal();
          // Optionally, you can add a success message or redirect
        } else {
          this.errorMessage = response.message || 'Error en el login';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error de conexión';
        console.error('Login error:', error);
      }
    });
  }

  private resetForm(): void {
    this.loginData = { username: '', password: '' };
    this.errorMessage = '';
    this.loading = false;
  }
}
