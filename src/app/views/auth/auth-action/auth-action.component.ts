import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'auth-action',
  templateUrl: './auth-action.component.html',
  styleUrl: './auth-action.component.css',
})
export class AuthActionComponent {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const mode = params['mode'];
      const oobCode = params['oobCode'];

      if (mode && oobCode) {
        switch (mode) {
          case 'resetPassword':
            this.router.navigate(['/change-password'], {
              queryParams: { oobCode },
            });
            break;
          // case 'recoverEmail':
          //   break;
          case 'verifyEmail':
            this.router.navigate(['/email-verification'], {
              queryParams: { oobCode },
            });
            break;
          default:
            this.router.navigate(['/']);
            break;
        }
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}
