import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: [
    './email-verification.component.css',
    '../base-auth-ui/base-auth-ui.component.css',
  ],
})
export class EmailVerificationComponent {
  protected oobCode: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (this.oobCode) {
      this.authService
        .verifyEmail(this.oobCode)
        .catch((error: { message: any }) => {
          console.error(error);
          alert(error.message);
        });
    } else {
      alert('Invalid email verification link');
      this.router.navigate(['/']);
    }
  }
}
