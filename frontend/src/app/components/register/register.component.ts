import { Component } from '@angular/core';
import { AuthService, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    if (!this.registerData.username || !this.registerData.email || 
        !this.registerData.password || !this.registerData.confirmPassword) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.errorMessage = 'Por favor, ingresa un email válido';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          console.log('Registro exitoso:', response.user);
          this.closeModal();
          // Optionally, you can add a success message
        } else {
          this.errorMessage = response.message || 'Error en el registro';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error de conexión';
        console.error('Register error:', error);
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private resetForm(): void {
    this.registerData = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    this.errorMessage = '';
    this.loading = false;
  }
}
