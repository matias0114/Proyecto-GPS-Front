import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Mock users database
  private mockUsers: User[] = [
    { id: 1, username: 'admin', email: 'admin@farmacia.com', role: 'admin' },
    { id: 2, username: 'usuario', email: 'usuario@farmacia.com', role: 'user' }
  ];

  constructor() {
    // Check if user is already logged in (stored in localStorage)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(loginData: LoginRequest): Observable<{ success: boolean; user?: User; message?: string }> {
    // Mock login logic
    const mockCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'usuario', password: 'user123' },
      { username: 'farmacia', password: 'farmacia123' }
    ];

    const validCredential = mockCredentials.find(
      cred => cred.username === loginData.username && cred.password === loginData.password
    );

    if (validCredential) {
      const user = this.mockUsers.find(u => u.username === validCredential.username) || {
        id: Date.now(),
        username: loginData.username,
        email: `${loginData.username}@farmacia.com`,
        role: 'user'
      };

      // Store user in localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);

      return of({ success: true, user }).pipe(delay(1000)); // Simulate API delay
    } else {
      return of({ 
        success: false, 
        message: 'Credenciales incorrectas. Prueba con: admin/admin123 o usuario/user123' 
      }).pipe(delay(1000));
    }
  }

  register(registerData: RegisterRequest): Observable<{ success: boolean; user?: User; message?: string }> {
    // Mock registration logic
    if (registerData.password !== registerData.confirmPassword) {
      return of({
        success: false,
        message: 'Las contraseñas no coinciden'
      }).pipe(delay(1000));
    }

    if (registerData.password.length < 6) {
      return of({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      }).pipe(delay(1000));
    }

    // Check if user already exists
    const existingUser = this.mockUsers.find(
      user => user.username === registerData.username || user.email === registerData.email
    );

    if (existingUser) {
      return of({
        success: false,
        message: 'El usuario o email ya existe'
      }).pipe(delay(1000));
    }

    // Create new user
    const newUser: User = {
      id: Date.now(),
      username: registerData.username,
      email: registerData.email,
      role: 'user'
    };

    this.mockUsers.push(newUser);
    
    // Auto login after registration
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    this.currentUserSubject.next(newUser);

    return of({ success: true, user: newUser }).pipe(delay(1000));
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
