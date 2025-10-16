import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  userData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.userData.name && this.userData.email && this.userData.password) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.signUp(this.userData.name, this.userData.email, this.userData.password)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            // Handle successful sign up and redirect to calendar
            console.log('Sign up successful:', response);
            this.router.navigate(['/calendar']);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Sign up error:', error);
            this.errorMessage = error.error?.error || error.message || 'Sign up failed. Please try again.';
          }
        });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
