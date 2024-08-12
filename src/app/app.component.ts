import { Component, OnInit, Renderer2 } from '@angular/core';
import {
  ChildrenOutletContexts,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';

import { AuthService } from './auth.service';
import { fadeInAnimation } from './route-animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fadeInAnimation],
})
export class AppComponent implements OnInit {
  isLoading: boolean = false;
  isLoggedIn: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private contexts: ChildrenOutletContexts
  ) {
    router.events.subscribe((event): void => {
      if (event instanceof RouteConfigLoadStart) {
        this.isLoading = true;
        this.renderer.setStyle(document.body, 'overflow', 'hidden');
      } else if (event instanceof RouteConfigLoadEnd) {
        this.isLoading = false;
        this.renderer.removeStyle(document.body, 'overflow');
      }
    });
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.isLoggedIn = true;
        // Redirect to user dashboard
        this.router.navigate([`/u/${user.uid}`]);
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  protected getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.[
      'animation'
    ];
  }
}
