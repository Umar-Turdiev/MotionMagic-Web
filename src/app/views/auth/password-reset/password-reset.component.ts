import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/auth.service';
import { getFirebaseAuthErrorMessage } from 'src/app/firebase-error-messages';
import { FirebaseAuthError } from 'src/app/firebase-error-codes';

@Component({
  selector: 'password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: [
    './password-reset.component.css',
    '../base-auth-ui/base-auth-ui.component.css',
  ],
})
export class PasswordResetComponent {
  protected email: string = '';

  protected emailErrorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  protected resetPassword() {
    this.clearError();

    this.authService
      .sendPasswordResetEmail(this.email)
      .then(() => {
        alert('Password reset email sent');
      })
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        this.handleError(error.code);
      });
  }

  private clearError() {
    this.emailErrorMessage = '';
  }

  private handleError(errorCode: any) {
    const errorMessage = getFirebaseAuthErrorMessage(errorCode);
    if (
      errorCode === FirebaseAuthError.InvalidEmail ||
      errorCode === FirebaseAuthError.MissingEmail
    ) {
      this.emailErrorMessage = errorMessage;
    } else {
      console.error(errorCode);
    }
  }
}
