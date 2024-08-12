import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      map((user) => {
        if (user && user.emailVerified) {
          // User is logged in and email is verified, allow access
          return true;
        } else if (user && !user.emailVerified) {
          // User is logged in but email is not verified, redirect to email verification page
          return false;
        } else {
          // User is not logged in, redirect to login page
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
