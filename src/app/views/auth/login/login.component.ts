import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/auth.service';
import { getFirebaseAuthErrorMessage } from 'src/app/firebase-error-messages';
import { FirebaseAuthError } from 'src/app/firebase-error-codes';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: [
    './login.component.css',
    '../base-auth-ui/base-auth-ui.component.css',
  ],
})
export class LoginComponent {
  protected email: string = '';
  protected password: string = '';

  protected emailErrorMessage: string = '';
  protected passwordErrorMessage: string = '';

  protected showEmailResend: boolean = false;
  private checkVerificationInterval: any;

  protected cooldownTime: number = 0;
  protected isCooldownActive: boolean = false;
  private cooldownInterval: any;

  constructor(private authService: AuthService, private router: Router) {}

  protected login() {
    this.clearError();

    this.authService
      .emailLogin(this.email, this.password)
      .then((result) => {
        if (result.user?.emailVerified) {
          this.router.navigate([`/u/${result.user.uid}`]);
        } else {
          this.emailErrorMessage = 'Please verify your email first.';
          this.showEmailResend = true;
          this.startEmailVerificationCheck();
        }
      })
      .catch((error) => {
        this.handleError(error.code);
      });
  }

  private clearError() {
    this.emailErrorMessage = '';
    this.passwordErrorMessage = '';
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
      errorCode === FirebaseAuthError.MissingPassword
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

  protected googleLogin() {
    this.authService
      .googleLogin()
      .then((result) => {
        if (result.user?.emailVerified) {
          this.router.navigate([`/u/${result.user.uid}`]);
        } else {
          alert('Please verify your email first');
        }
      })
      .catch((error) => {
        this.handleError(error.code);
      });
  }
}
