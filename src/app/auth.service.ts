import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  public googleLogin() {
    return this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public emailLogin(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  public emailSignup(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  public sendEmailVerification() {
    return this.afAuth.currentUser.then((user) => {
      return user?.sendEmailVerification();
    });
  }

  public verifyEmail(oobCode: string) {
    return this.afAuth.applyActionCode(oobCode);
  }

  public sendPasswordResetEmail(email: string) {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  public confirmPasswordReset(oobCode: string, newPassword: string) {
    return this.afAuth.confirmPasswordReset(oobCode, newPassword);
  }

  public logOut() {
    return this.afAuth.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }

  public reloadUser() {
    return this.afAuth.currentUser.then((user) => {
      return user?.reload().then(() => user);
    });
  }

  public getCurrentUser() {
    return this.afAuth.authState;
  }
}
