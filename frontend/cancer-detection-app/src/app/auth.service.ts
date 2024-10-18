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
  private apiUrl = 'http://127.0.0.1:8000/'; // Adjust based on your Django setup

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<Token> {
    return this.http.post<Token>(`${this.apiUrl}login/`, { email, password });
  }

  // Update the register method to include firstName and lastName
  register(firstName: string, lastName: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register/`, { firstName, lastName, email, password });
  }
}
