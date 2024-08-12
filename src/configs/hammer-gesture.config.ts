import { HammerGestureConfig } from '@angular/platform-browser';

export class HammerConfig extends HammerGestureConfig {
  override overrides = {
    pan: { direction: Hammer.DIRECTION_ALL, threshold: 0 },
    press: { enable: true, time: 20 },
    pinch: { enable: true, pointers: 2 },
  };
}
