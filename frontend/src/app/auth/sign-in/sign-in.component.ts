import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  credentials = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.credentials.email && this.credentials.password) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.signIn(this.credentials.email, this.credentials.password)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            // Handle successful sign in and redirect to calendar
            console.log('Sign in successful:', response);
            this.router.navigate(['/calendar']);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Sign in error:', error);
            this.errorMessage = error.error?.error || error.message || 'Sign in failed. Please try again.';
          }
        });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
