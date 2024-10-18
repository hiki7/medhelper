import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service'; // Adjust the path as necessary

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Check if running in the browser before calling logout
    if (typeof window !== 'undefined') {
      this.authService.logout(); // Call logout logic to clear tokens
    }
  }

  redirectToLogin() {
    this.router.navigate(['/login']); // Redirect to login page
  }
}
