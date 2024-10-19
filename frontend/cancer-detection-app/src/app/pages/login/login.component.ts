import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';  // Adjust the path as necessary

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  title: string = 'Connection to Django app';
  logged: boolean = false;
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.authState.loggedIn$.subscribe(loggedIn => {
      this.logged = loggedIn;
      if (loggedIn) {
        this.router.navigate(['/chat']);
      }
    });

    // Check if running in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const access: string | null = localStorage.getItem('access');
      this.logged = !!access; // Set logged status based on access token
    }
  }

  login(): void {
    this.authService.login(this.email, this.password).subscribe(data => {
      this.authService.handleLogin(data); // Handle login logic
      this.router.navigate(['/chat']); // Redirect to main page
    }, error => {
      this.errorMessage = 'Login failed. Please check your credentials.';
    });
  }
}
