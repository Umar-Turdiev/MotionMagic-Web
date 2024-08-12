import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

import { HSV } from 'src/app/model/color-formats.model';

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css'],
})
export class ColorPickerComponent {
  @ViewChild('colorPickerElement', { static: true })
  colorPickerElementRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('colorPickerPointerElement', { static: true })
  colorPickerPointerElementRef!: ElementRef<HTMLDivElement>;

  @ViewChild('valueSlider', { static: true })
  valueSliderElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('valueHandle', { static: true })
  valueHandleElementRef!: ElementRef<HTMLDivElement>;

  @ViewChild('opacitySlider', { static: true })
  opacitySliderElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('opacityOverlay', { static: true })
  opacityOverlayElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('opacityHandle', { static: true })
  opacityHandleElementRef!: ElementRef<HTMLDivElement>;

  @Input()
  set hsv(value: HSV) {
    this.colorHSV = value;
    this.colorRGB = this.colorHSV.toRGB();
    this.colorHEX = this.colorHSV.toHex();
  }

  get hsv(): HSV {
    return this.colorHSV;
  }

  @Input()
  set hex(value: string) {
    this.colorHEX = value;
    this.colorHSV = HSV.fromHex(value);
    this.colorRGB = this.colorHSV.toRGB();
  }

  get hex(): string {
    return this.colorHEX;
  }

  @Input()
  set opacity(value: number) {
    this._opacity = value;
  }

  get opacity(): number {
    return this._opacity;
  }

  @Output() colorChange: EventEmitter<HSV> = new EventEmitter<HSV>();
  @Output() opacityChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() finishiColorChange: EventEmitter<{hsv:HSV,opacity:number}> = new EventEmitter<{hsv:HSV,opacity:number}>();

  protected colorHSV = new HSV(0, 0, 100);
  protected SetHSVHue(value: number) {
    this.colorHSV.hue = value;
    this.updateColorPickerPosition();
    this.colorChange.emit(this.colorHSV);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }
  protected SetHSVSaturation(value: number) {
    this.colorHSV.saturation = value;
    this.updateColorPickerPosition();
    this.colorChange.emit(this.colorHSV);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }
  protected SetHSVValue(value: number) {
    this.colorHSV.value = value;
    this.updateColorPickerPosition();
    this.colorChange.emit(this.colorHSV);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }

  protected colorRGB = new HSV(0, 0, 100).toRGB();
  protected SetRGBRed(value: number) {
    this.colorRGB.red = value;
    this.colorHSV = this.colorRGB.toHSV();
    this.updateColorPickerPosition();
    this.colorChange.emit(this.colorHSV);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }
  protected SetRGBGreen(value: number) {
    this.colorRGB.green = value;
    this.colorHSV = this.colorRGB.toHSV();
    this.updateColorPickerPosition();
    this.colorChange.emit(this.colorHSV);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }
  protected SetRGBBlue(value: number) {
    this.colorRGB.blue = value;
    this.colorHSV = this.colorRGB.toHSV();
    this.updateColorPickerPosition();
    this.colorChange.emit(this.colorHSV);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }

  protected colorHEX = new HSV(0, 0, 100).toHex();
  protected SetHEX(value: string) {
    this.colorHEX = value;
    this.colorHSV = HSV.fromHex(this.colorHEX);
    this.updateColorPickerPosition();
    this.colorChange.emit(this.colorHSV);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }

  private _opacity = 100;
  protected SetOpacity(value: number) {
    this._opacity = value;
    this.updateColorPickerPosition();
    this.opacityChange.emit(this._opacity);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  }

  protected selectedColorSpace = 'hsv';

  private ctx: CanvasRenderingContext2D | null = null;
  private centerX: number = 80;
  private centerY: number = 80;
  private radius: number = 80;

  ngAfterViewInit() {
    this.ctx = this.colorPickerElementRef.nativeElement.getContext('2d');

    this.renderColorWheel();

    this.updateColorPickerPosition();

    // Attach touch event listeners
    this.colorPickerElementRef.nativeElement.addEventListener(
      'touchstart',
      this.onColorPickerTouchStart.bind(this),
    );
    this.valueSliderElementRef.nativeElement.addEventListener(
      'touchstart',
      this.onValueSliderTouchStart.bind(this),
    );
    this.opacitySliderElementRef.nativeElement.addEventListener(
      'touchstart',
      this.onOpacitySliderTouchStart.bind(this),
    );
  }

  private updateColorPickerPosition() {
    const angle = (this.colorHSV.hue * Math.PI) / 180;
    const distance = (this.colorHSV.saturation / 100) * this.radius;
    const newX = this.centerX + distance * Math.cos(angle);
    const newY = this.centerY + distance * Math.sin(angle);
    this.movePointer(newX, newY);

    const valueSliderWidth = 180;
    const valueHandleWidth = 20;
    const handelSideGap = 3;

    const valueX =
      (this.colorHSV.value *
        (valueSliderWidth - 2 * handelSideGap - valueHandleWidth)) /
        100 +
      handelSideGap;

    this.moveValueSliderHandel(valueX);

    const opacityX =
      (this._opacity *
        (valueSliderWidth - 2 * handelSideGap - valueHandleWidth)) /
        100 +
      handelSideGap;

    this.moveOpacitySliderHandel(opacityX);
  }

  /* Color Picker */
  private renderColorWheel() {
    if (this.ctx) {
      for (let angle = 0; angle < 360; angle++) {
        const startAngle = ((angle - 2) * Math.PI) / 180;
        const endAngle = ((angle + 2) * Math.PI) / 180;

        // Create linear gradient from center to edge
        const gradient = this.ctx.createLinearGradient(
          this.centerX,
          this.centerY, // Start point (center)
          this.centerX + this.radius * Math.cos(startAngle), // End point (edge)
          this.centerY + this.radius * Math.sin(startAngle),
        );

        // Add color stops to the gradient
        gradient.addColorStop(0, 'white'); // Start at center (white)
        gradient.addColorStop(1, 'hsl(' + angle + ', 100%, 50%)'); // End at edge (color based on angle)

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.arc(
          this.centerX,
          this.centerY,
          this.radius,
          startAngle,
          endAngle,
        );
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
    }
  }

  private drawColorPointer() {
    const colorPickerPointer = this.colorPickerPointerElementRef.nativeElement;

    const intermidiateColorHSL = this.colorHSV.toHSL();

    colorPickerPointer.style.backgroundColor = `hsl(${intermidiateColorHSL.hue}, ${intermidiateColorHSL.saturation}%, ${intermidiateColorHSL.lightness}%)`;
  }

  private updateAllColorSpace() {
    this.colorRGB = this.colorHSV.toRGB();
    this.colorHEX = this.colorHSV.toHex();

    this.colorChange.emit(this.colorHSV);
  }

  private getColorAtPositionHSV(
    x: number,
    y: number,
  ): { hue: number; saturation: number } {
    if (this.ctx) {
      const dx = x - this.centerX;
      const dy = y - this.centerY;
      let angle = Math.atan2(dy, dx);
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > this.radius) {
        distance = this.radius;
      }
      if (angle < 0) {
        angle += 2 * Math.PI;
      }

      // Convert angle from radians to degrees
      const hue = parseFloat(((angle * 180) / Math.PI).toFixed(2));

      // Calculate saturation and value
      const saturation = parseFloat(
        ((distance / this.radius) * 100).toFixed(2),
      );

      return {
        hue: hue === 360 ? 0 : hue,
        saturation: saturation,
      };
    } else {
      return { hue: 0, saturation: 0 }; // Return default values if ctx is null
    }
  }

  private movePointer(x: number, y: number) {
    const colorPickerPointer = this.colorPickerPointerElementRef.nativeElement;

    colorPickerPointer.style.left = x + 'px';
    colorPickerPointer.style.top = y + 'px';

    const intermidiateColor = this.getColorAtPositionHSV(x, y);
    this.colorHSV.hue = intermidiateColor.hue;
    this.colorHSV.saturation = intermidiateColor.saturation;

    this.drawColorPointer();

    this.drawValueSlider();
    this.drawValueHandel();

    this.drawOpacitySlider();
    this.drawOpacityHandel();

    this.updateAllColorSpace();
  }

  private movePointerToMousePosition(x: number, y: number) {
    const colorPickerRect =
      this.colorPickerElementRef.nativeElement.getBoundingClientRect();
    const offsetX = x - colorPickerRect.left;
    const offsetY = y - colorPickerRect.top;

    const angle = Math.atan2(offsetY - this.centerY, offsetX - this.centerX);
    const distanceFromCenter = Math.min(
      Math.sqrt((offsetX - this.centerX) ** 2 + (offsetY - this.centerY) ** 2),
      this.radius,
    );

    const newX = this.centerX + distanceFromCenter * Math.cos(angle);
    const newY = this.centerY + distanceFromCenter * Math.sin(angle);

    this.movePointer(newX, newY);
  }

  onColorPickerMouseDown(event: MouseEvent) {
    this.movePointerToMousePosition(event.clientX, event.clientY);

    document.addEventListener('mousemove', this.onColorPickerMouseMove);
    document.addEventListener('mouseup', this.onColorPickerMouseUp);
  }

  onColorPickerMouseMove = (event: MouseEvent) => {
    this.movePointerToMousePosition(event.clientX, event.clientY);
  };

  onColorPickerMouseUp = () => {
    document.removeEventListener('mousemove', this.onColorPickerMouseMove);
    document.removeEventListener('mouseup', this.onColorPickerMouseUp);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  };

  onColorPickerTouchStart(event: TouchEvent) {
    // Prevent default touch behavior (e.g., scrolling)
    event.preventDefault();

    const touch = event.touches[0];
    this.movePointerToMousePosition(touch.clientX, touch.clientY);

    document.addEventListener('touchmove', this.onColorPickerTouchMove);
    document.addEventListener('touchend', this.onColorPickerTouchEnd);
  }

  onColorPickerTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    this.movePointerToMousePosition(touch.clientX, touch.clientY);
  };

  onColorPickerTouchEnd = () => {
    document.removeEventListener('touchmove', this.onColorPickerTouchMove);
    document.removeEventListener('touchend', this.onColorPickerTouchEnd);
  };
  /* Color Picker */

  /* Value Slider */
  private drawValueSlider() {
    const valueSlider = this.valueSliderElementRef.nativeElement;

    const startGradient = new HSV(
      this.colorHSV.hue,
      this.colorHSV.saturation,
      0,
    ).toHSL();
    const endGradient = new HSV(
      this.colorHSV.hue,
      this.colorHSV.saturation,
      100,
    ).toHSL();

    valueSlider.style.background = `linear-gradient(to right, 
      hsl(${startGradient.hue}, ${startGradient.saturation}%, ${startGradient.lightness}%),
      hsl(${endGradient.hue}, ${endGradient.saturation}%, ${endGradient.lightness}%))`;
  }

  private drawValueHandel() {
    const valueHandle = this.valueHandleElementRef.nativeElement;

    const intermidiateColorHSL = this.colorHSV.toHSL();

    valueHandle.style.backgroundColor = `hsl(${intermidiateColorHSL.hue}, ${intermidiateColorHSL.saturation}%, ${intermidiateColorHSL.lightness}%)`;
  }

  private moveValueSliderHandel(x: number) {
    this.valueHandleElementRef.nativeElement.style.left = x + 'px';

    this.drawColorPointer();

    this.drawValueHandel();

    this.drawOpacitySlider();
    this.drawOpacityHandel();

    this.colorChange.emit(this.colorHSV);
    this.updateAllColorSpace();
  }

  private moveValueSliderHandelMousePosition(x: number) {
    const valueSliderRect =
      this.valueHandleElementRef.nativeElement.parentElement!.getBoundingClientRect();
    const valueHandle = this.valueHandleElementRef.nativeElement;
    const valueHandleBoundingRect = valueHandle.getBoundingClientRect();
    const handelSideGap = 3;

    const maxOffsetX =
      valueSliderRect.width - valueHandleBoundingRect.width - handelSideGap;
    const minOffsetX = handelSideGap;

    let offsetX = x - valueSliderRect.left - valueHandleBoundingRect.width / 2;

    offsetX = Math.max(minOffsetX, Math.min(offsetX, maxOffsetX));

    const value =
      ((offsetX - handelSideGap) /
        (valueSliderRect.width -
          2 * handelSideGap -
          valueHandleBoundingRect.width)) *
      100;

    // Update the saturation value
    this.colorHSV.value = parseFloat(value.toFixed(2));

    this.moveValueSliderHandel(offsetX);
  }

  onValueSliderMouseDown(event: MouseEvent) {
    this.moveValueSliderHandelMousePosition(event.clientX);

    document.addEventListener('mousemove', this.onValueSliderMouseMove);
    document.addEventListener('mouseup', this.onValueSliderMouseUp);
  }

  onValueSliderMouseMove = (event: MouseEvent) => {
    this.moveValueSliderHandelMousePosition(event.clientX);
  };

  onValueSliderMouseUp = () => {
    document.removeEventListener('mousemove', this.onValueSliderMouseMove);
    document.removeEventListener('mouseup', this.onValueSliderMouseUp);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  };

  onValueSliderTouchStart(event: TouchEvent) {
    // Prevent default touch behavior (e.g., scrolling)
    event.preventDefault();

    const touch = event.touches[0];
    this.moveValueSliderHandelMousePosition(touch.clientX);

    document.addEventListener('touchmove', this.onValueSliderTouchMove);
    document.addEventListener('touchend', this.onValueSliderTouchEnd);
  }

  onValueSliderTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    this.moveValueSliderHandelMousePosition(touch.clientX);
  };

  onValueSliderTouchEnd = () => {
    document.removeEventListener('touchmove', this.onValueSliderTouchMove);
    document.removeEventListener('touchend', this.onValueSliderTouchEnd);
  };
  /* Value Slider */

  /* Opacity Slider */
  private drawOpacitySlider() {
    const opacityOverlay = this.opacityOverlayElementRef.nativeElement;

    const intermidiateColorHSL = this.colorHSV.toHSL();

    const startColor = `hsla(${intermidiateColorHSL.hue}, ${intermidiateColorHSL.saturation}%, ${intermidiateColorHSL.lightness}%, 0)`;
    const endColor = `hsla(${intermidiateColorHSL.hue}, ${intermidiateColorHSL.saturation}%, ${intermidiateColorHSL.lightness}%, 1)`;

    opacityOverlay.style.background = `linear-gradient(to right, ${startColor}, ${endColor})`;
  }

  private drawOpacityHandel() {
    const opacityHandle = this.opacityHandleElementRef.nativeElement;

    const intermidiateColorHSL = this.colorHSV.toHSL();

    opacityHandle.style.backgroundColor = `hsl(${intermidiateColorHSL.hue}, ${intermidiateColorHSL.saturation}%, ${intermidiateColorHSL.lightness}%)`;
  }

  private moveOpacitySliderHandel(x: number) {
    this.opacityHandleElementRef.nativeElement.style.left = x + 'px';

    this.drawColorPointer();

    this.drawValueHandel();

    this.drawOpacitySlider();
    this.drawOpacityHandel();

    this.opacityChange.emit(this._opacity);
  }

  private moveOpacitySliderHandelMousePosition(x: number) {
    const opacitySliderRect =
      this.opacityHandleElementRef.nativeElement.parentElement!.getBoundingClientRect();
    const opacityHandle = this.opacityHandleElementRef.nativeElement;
    const opacityHandleBoundingRect = opacityHandle.getBoundingClientRect();
    const handelSideGap = 3;

    const maxOffsetX =
      opacitySliderRect.width - opacityHandleBoundingRect.width - handelSideGap;
    const minOffsetX = handelSideGap;

    let offsetX =
      x - opacitySliderRect.left - opacityHandleBoundingRect.width / 2;

    offsetX = Math.max(minOffsetX, Math.min(offsetX, maxOffsetX));

    const value =
      ((offsetX - handelSideGap) /
        (opacitySliderRect.width -
          2 * handelSideGap -
          opacityHandleBoundingRect.width)) *
      100;

    this._opacity = parseFloat(value.toFixed(2));

    this.moveOpacitySliderHandel(offsetX);
  }

  onOpacitySliderMouseDown(event: MouseEvent) {
    this.moveOpacitySliderHandelMousePosition(event.clientX);

    document.addEventListener('mousemove', this.onOpacitySliderMouseMove);
    document.addEventListener('mouseup', this.onOpacitySliderMouseUp);
  }

  onOpacitySliderMouseMove = (event: MouseEvent) => {
    this.moveOpacitySliderHandelMousePosition(event.clientX);
  };

  onOpacitySliderMouseUp = () => {
    document.removeEventListener('mousemove', this.onOpacitySliderMouseMove);
    document.removeEventListener('mouseup', this.onOpacitySliderMouseUp);
    this.finishiColorChange.emit({hsv:this.colorHSV,opacity:this._opacity});
  };

  onOpacitySliderTouchStart(event: TouchEvent) {
    // Prevent default touch behavior (e.g., scrolling)
    event.preventDefault();

    const touch = event.touches[0];
    this.moveOpacitySliderHandelMousePosition(touch.clientX);

    document.addEventListener('touchmove', this.onOpacitySliderTouchMove);
    document.addEventListener('touchend', this.onOpacitySliderTouchEnd);
  }

  onOpacitySliderTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    this.moveOpacitySliderHandelMousePosition(touch.clientX);
  };

  onOpacitySliderTouchEnd = () => {
    document.removeEventListener('touchmove', this.onOpacitySliderTouchMove);
    document.removeEventListener('touchend', this.onOpacitySliderTouchEnd);
  };
  /* Opacity Slider */
}
