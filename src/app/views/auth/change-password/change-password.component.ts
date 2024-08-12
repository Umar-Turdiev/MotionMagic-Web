import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from 'src/app/auth.service';
import { FirebaseAuthError } from 'src/app/firebase-error-codes';
import { getFirebaseAuthErrorMessage } from 'src/app/firebase-error-messages';

@Component({
  selector: 'change-password',
  templateUrl: './change-password.component.html',
  styleUrls: [
    './change-password.component.css',
    '../base-auth-ui/base-auth-ui.component.css',
  ],
})
export class ChangePasswordComponent {
  protected oobCode: string | null = null;

  protected newPassword: string = '';
  protected confirmNewPassword: string = '';

  protected passwordChanged: boolean = false;

  protected passwordErrorMessage: string = '';
  protected confirmPasswordErrorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (!this.oobCode) {
      alert('Invalid password reset link');
      this.router.navigate(['/']);
    }
  }

  protected changePassword() {
    this.clearError();

    if (this.newPassword !== this.confirmNewPassword) {
      this.confirmPasswordErrorMessage = 'Passwords do not match.';
      return;
    }
    if (this.oobCode) {
      this.authService
        .confirmPasswordReset(this.oobCode, this.newPassword)
        .then(() => {
          this.passwordChanged = true;
        })
        .catch((error) => {
          this.handleError(error.code);
        });
    }
  }

  private clearError() {
    this.passwordErrorMessage = '';
    this.confirmPasswordErrorMessage = '';
  }

  private handleError(errorCode: any) {
    const errorMessage = getFirebaseAuthErrorMessage(errorCode);
    if (
      errorCode === FirebaseAuthError.InvalidCredential ||
      errorCode === FirebaseAuthError.MissingPassword ||
      errorCode === FirebaseAuthError.WeakPassword
    ) {
      this.passwordErrorMessage = errorMessage;
    } else {
      alert(errorMessage);
    }
  }
}
