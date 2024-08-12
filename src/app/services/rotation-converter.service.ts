import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RotationConverterService {
  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}
