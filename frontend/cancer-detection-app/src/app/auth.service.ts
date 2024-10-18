import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthStateService } from './auth-state.service'; // Import the new service

export interface Token {
  access: string;
  refresh: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/'; // Adjust based on your Django setup

  constructor(private http: HttpClient, public authState: AuthStateService) {}

  login(email: string, password: string): Observable<Token> {
    return this.http.post<Token>(`${this.apiUrl}login/`, { email, password });
  }

  register(firstName: string, lastName: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, { firstName, lastName, email, password });
  }

  logout(): void {
    // Check if running in the browser
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      this.authState.setLoggedIn(false); // Notify the state change
    }
  }

  handleLogin(data: Token): void {
    if (data.access) {
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      this.authState.setLoggedIn(true); // Notify the state change
    }
  }
}
