import { Component, ViewChild } from '@angular/core';
import { AuthService, User } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild(LoginComponent) loginComponent!: LoginComponent;
  @ViewChild(RegisterComponent) registerComponent!: RegisterComponent;

  title = 'frontend';
  currentUser: User | null = null;

  constructor(private authService: AuthService) {
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  openLogin(): void {
    this.loginComponent?.openModal();
  }

  openRegister(): void {
    this.registerComponent?.openModal();
  }

  logout(): void {
    this.authService.logout();
  }
}
