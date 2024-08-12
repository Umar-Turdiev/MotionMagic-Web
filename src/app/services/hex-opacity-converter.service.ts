import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HexOpacityConverterService {
  constructor() {}

  static hexOpacityToPercentage(hexOpacity: string): number {
    const opacityDecimal = parseInt(hexOpacity, 16) / 255;
    return Math.round(opacityDecimal * 100);
  }

  static percentageToHexOpacity(percentage: number): string {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage value must be between 0 and 100');
    }
    const opacityDecimal = percentage / 100;
    const opacityHex = Math.round(opacityDecimal * 255)
      .toString(16)
      .padStart(2, '0');
    return opacityHex;
  }
}
