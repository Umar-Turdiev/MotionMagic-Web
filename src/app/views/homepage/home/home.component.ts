import { Component, ViewChild, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  protected menuOpen: boolean = false;

  constructor(private router: Router) {}

  protected login() {
    this.router.navigate(['login']);
  }

  protected signup() {
    this.router.navigate(['/signup']);
  }

  protected toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
