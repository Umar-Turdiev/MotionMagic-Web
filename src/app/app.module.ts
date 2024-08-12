import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';

import { HammerModule } from '@angular/platform-browser';
import { HammerConfig } from 'src/configs/hammer-gesture.config';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BaseAuthUiComponent } from './views/auth/base-auth-ui/base-auth-ui.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './views/auth/login/login.component';
import { SignupComponent } from './views/auth/signup/signup.component';
import { HomeComponent } from './views/homepage/home/home.component';
import { EmailVerificationComponent } from './views/auth/email-verification/email-verification.component';
import { ChangePasswordComponent } from './views/auth/change-password/change-password.component';
import { PasswordResetComponent } from './views/auth/password-reset/password-reset.component';
import { AuthActionComponent } from './views/auth/auth-action/auth-action.component';

@NgModule({
  declarations: [
    AppComponent,
    BaseAuthUiComponent,
    LoginComponent,
    SignupComponent,
    HomeComponent,
    EmailVerificationComponent,
    ChangePasswordComponent,
    PasswordResetComponent,
    AuthActionComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HammerModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
  ],
  providers: [
    { provide: HAMMER_GESTURE_CONFIG, useClass: HammerConfig },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
