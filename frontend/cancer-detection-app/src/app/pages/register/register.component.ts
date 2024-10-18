import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service'; // Adjust the path as necessary

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.password === this.confirmPassword) {
      this.authService.register(this.firstName, this.lastName, this.email, this.password).subscribe(() => {
        this.router.navigate(['/confirmation']);
      }, error => {
        this.errorMessage = 'Registration failed. Please try again.';
      });
    } else {
      this.errorMessage = 'Passwords do not match!';
    }
  }
}
