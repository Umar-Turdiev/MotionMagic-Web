import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from 'src/app/auth.guard';
import { HomeComponent } from 'src/app/views/homepage/home/home.component';
import { LoginComponent } from 'src/app/views/auth/login/login.component';
import { SignupComponent } from 'src/app/views/auth/signup/signup.component';
import { EmailVerificationComponent } from 'src/app/views/auth/email-verification/email-verification.component';
import { PasswordResetComponent } from 'src/app/views/auth/password-reset/password-reset.component';
import { ChangePasswordComponent } from 'src/app/views/auth/change-password/change-password.component';
import { AuthActionComponent } from 'src/app/views/auth/auth-action/auth-action.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent, data: { animation: 'fadeIn' } },
  { path: 'signup', component: SignupComponent },
  { path: '__/auth-action', component: AuthActionComponent },
  { path: 'email-verification', component: EmailVerificationComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  {
    path: 'u/:userId',
    loadChildren: () =>
      import('src/app/views/user-dashboard/user-dashboard.module').then(
        (m) => m.UserDashboardModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'simulator',
    loadChildren: () =>
      import('./views/simulator/simulator.module').then(
        (m) => m.SimulatorModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
