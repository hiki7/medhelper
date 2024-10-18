import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Token {
  access: string;
  refresh: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth/'; // Adjust based on your Django setup

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<Token> {
    return this.http.post<Token>(`${this.apiUrl}login/`, { email, password });
  }

  // Implement the register method
  register(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, { email, password });
  }
}
