import { trigger, transition, style, animate } from '@angular/animations';

export const fadeInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ opacity: 0.3 }),
    animate('300ms', style({ opacity: 1 })),
  ]),
]);
