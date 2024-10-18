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

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.password === this.confirmPassword) {
      this.authService.register(this.firstName, this.lastName, this.email, this.password).subscribe(() => {
        alert('Registration successful! You can now log in.');
        this.router.navigate(['/login']);
      }, error => {
        alert('Registration failed. Please try again.');
      });
    } else {
      alert('Passwords do not match!');
    }
  }
}
