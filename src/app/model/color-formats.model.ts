export class HSV {
  constructor(
    public hue: number = 0,
    public saturation: number = 0,
    public value: number = 0,
  ) {}

  toHSL(): HSL {
    const output = new HSL();

    output.hue = this.hue;

    output.lightness = Math.round((this.value * (200 - this.saturation)) / 200);

    output.saturation = Math.round(
      output.lightness === 0 || output.lightness === 100
        ? 0
        : ((this.value - output.lightness) /
            Math.min(output.lightness, 100 - output.lightness)) *
            100,
    );

    return output;
  }

  toRGB(): RGB {
    const c = (this.value / 100) * (this.saturation / 100);
    const x = c * (1 - Math.abs(((this.hue / 60) % 2) - 1));
    const m = this.value / 100 - c;

    let r = 0,
      g = 0,
      b = 0;

    if (this.hue >= 0 && this.hue < 60) {
      r = c;
      g = x;
    } else if (this.hue >= 60 && this.hue < 120) {
      r = x;
      g = c;
    } else if (this.hue >= 120 && this.hue < 180) {
      g = c;
      b = x;
    } else if (this.hue >= 180 && this.hue < 240) {
      g = x;
      b = c;
    } else if (this.hue >= 240 && this.hue < 300) {
      r = x;
      b = c;
    } else if (this.hue >= 300 && this.hue < 360) {
      r = c;
      b = x;
    }

    return new RGB(
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    );
  }

  toHex(): string {
    const rgb = this.toRGB();
    return `#${rgb.red.toString(16).padStart(2, '0')}${rgb.green.toString(16).padStart(2, '0')}${rgb.blue.toString(16).padStart(2, '0')}`;
  }

  static fromHex(hex: string): HSV {
    const rgb = new RGB(
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    );
    return rgb.toHSV();
  }
}

export class HSL {
  constructor(
    public hue: number = 0,
    public saturation: number = 0,
    public lightness: number = 0,
  ) {}
}

export class RGB {
  constructor(
    public red: number = 0,
    public green: number = 0,
    public blue: number = 0,
  ) {}

  toHSV(): HSV {
    const r = this.red / 255;
    const g = this.green / 255;
    const b = this.blue / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let hue = 0;
    if (max === min) {
      hue = 0; // Achromatic (grey)
    } else {
      const d = max - min;
      switch (max) {
        case r:
          hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          hue = ((b - r) / d + 2) / 6;
          break;
        case b:
          hue = ((r - g) / d + 4) / 6;
          break;
      }
    }

    const saturation = max === 0 ? 0 : (max - min) / max;
    const value = max;

    return new HSV(
      parseFloat((hue * 360).toFixed(2)),
      parseFloat((saturation * 100).toFixed(2)),
      parseFloat((value * 100).toFixed(2)),
    );
  }
}
