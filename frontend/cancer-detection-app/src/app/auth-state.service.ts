import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  loggedIn$ = this.loggedInSubject.asObservable();

  setLoggedIn(value: boolean) {
    this.loggedInSubject.next(value);
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }
}
