import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://127.0.0.1:8000/';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getChatList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}chats/`, { headers: this.getAuthHeaders() });
  }

  createChat(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}create_chat/`, {}, { headers: this.getAuthHeaders() });
  }

  getChatContext(chatTitle: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}get_context/?chat_title=${encodeURIComponent(chatTitle)}`, { headers: this.getAuthHeaders() });
  }

  sendMessage(chatTitle: string, userInput: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = new FormData();
    body.append('description', userInput);
    body.append('chat_title', chatTitle);

    return this.http.post<any>(`${this.apiUrl}assistant/`, body, { headers });
  }

  uploadImageOrText(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}assistant/`, formData, { headers: this.getAuthHeaders() });
  }
}
