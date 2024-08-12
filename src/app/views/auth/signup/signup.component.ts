import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/auth.service';
import { FirebaseAuthError } from 'src/app/firebase-error-codes';
import { getFirebaseAuthErrorMessage } from 'src/app/firebase-error-messages';

@Component({
  selector: 'signup',
  templateUrl: './signup.component.html',
  styleUrls: [
    './signup.component.css',
    '../base-auth-ui/base-auth-ui.component.css',
  ],
})
export class SignupComponent {
  protected username: string = '';
  protected email: string = '';
  protected password: string = '';
  protected confirmPassword: string = '';

  protected usernameErrorMessage: string = '';
  protected emailErrorMessage: string = '';
  protected passwordErrorMessage: string = '';
  protected confirmPasswordErrorMessage: string = '';

  protected firstVerificationSent = false;
  protected checkVerificationInterval: any;

  protected cooldownTime: number = 0;
  protected isCooldownActive: boolean = false;
  private cooldownInterval: any;

  constructor(private authService: AuthService, private router: Router) {}

  protected signUp() {
    this.clearError();

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    } else if (!this.username) {
      this.usernameErrorMessage = 'Please enter a username.';
      return;
    }
    this.authService
      .emailSignup(this.email, this.password)
      .then((result) => {
        if (result.user) {
          return result.user.updateProfile({
            displayName: this.username,
          });
        }

        throw new Error('User cannot be created');
      })
      .then(() => {
        this.authService.sendEmailVerification().then(() => {
          this.startCooldown();
        });
        this.firstVerificationSent = true;
        this.startEmailVerificationCheck();
      })
      .catch((error) => {
        this.handleError(error.code);
      });
  }

  private clearError() {
    this.usernameErrorMessage = '';
    this.emailErrorMessage = '';
    this.passwordErrorMessage = '';
    this.confirmPasswordErrorMessage = '';
  }

  private handleError(errorCode: any) {
    const errorMessage = getFirebaseAuthErrorMessage(errorCode);
    if (
      errorCode === FirebaseAuthError.InvalidEmail ||
      errorCode === FirebaseAuthError.MissingEmail
    ) {
      this.emailErrorMessage = errorMessage;
    } else if (
      errorCode === FirebaseAuthError.InvalidCredential ||
      errorCode === FirebaseAuthError.MissingPassword ||
      errorCode === FirebaseAuthError.WeakPassword
    ) {
      this.passwordErrorMessage = errorMessage;
    } else {
      alert(errorMessage);
    }
  }

  protected resendVerificationEmail() {
    this.authService
      .sendEmailVerification()
      .then(() => {
        this.startCooldown();
      })
      .catch((error: { message: any }) => {
        console.error(error);
      });
  }

  private startCooldown() {
    this.cooldownTime = 60;
    this.isCooldownActive = true;

    this.cooldownInterval = setInterval(() => {
      this.cooldownTime--;
      if (this.cooldownTime <= 0) {
        clearInterval(this.cooldownInterval);
        this.isCooldownActive = false;
      }
    }, 1000);
  }

  private startEmailVerificationCheck() {
    this.checkVerificationInterval = setInterval(() => {
      this.authService.reloadUser().then((user) => {
        if (user?.emailVerified) {
          clearInterval(this.checkVerificationInterval);
          this.router.navigate([`/u/${user.uid}`]);
        }
      });
    }, 3000);
  }
}
