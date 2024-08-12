import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: [
    './user-dashboard.component.css',
    '../auth/base-auth-ui/base-auth-ui.component.css',
  ],
})
export class UserDashboardComponent implements OnInit {
  userId: string | null = '';
  user: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('userId');
      this.authService.getCurrentUser().subscribe((user) => {
        this.user = user;
      });
    });
  }

  protected logOut() {
    this.authService.logOut();
    this.router.navigate(['']);
  }
}
