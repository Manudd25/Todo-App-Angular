import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (this.email) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      this.authService.forgotPassword(this.email)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Password reset link sent to your email address. Please check your inbox.';
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Failed to send reset link. Please try again.';
          }
        });
    }
  }
}
