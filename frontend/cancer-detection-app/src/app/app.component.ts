import { Component } from '@angular/core';
import { AuthService } from './auth.service'; // Adjust the path as necessary
import { AuthStateService } from './auth-state.service'; // Import the new service

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  logged: boolean = false;

  constructor(private authService: AuthService, private authState: AuthStateService) {
    this.authState.loggedIn$.subscribe(loggedIn => {
      this.logged = loggedIn; // Update logged status based on state changes
    });
  }

  logout() {
    this.authService.logout(); // Call the logout method
  }
}
