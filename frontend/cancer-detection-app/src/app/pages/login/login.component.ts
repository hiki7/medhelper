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
    if (typeof window !== 'undefined') {
      const access: string | null = localStorage.getItem('access');
      if (access) {
        this.logged = true;
        this.router.navigate(['/chat']);
      }
    }
  }

  login(): void {
    this.authService.login(this.email, this.password).subscribe((data) => {
      if (data.access) {
        this.logged = true;
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        this.router.navigate(['/']);
      }
    }, error => {
      this.errorMessage = 'Login failed. Please check your credentials.';
    });
  }

  logout(): void {
    this.logged = false;
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }
}
