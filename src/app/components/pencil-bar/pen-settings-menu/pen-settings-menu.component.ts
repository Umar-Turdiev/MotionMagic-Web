import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { PenType, PenProperties } from 'src/app/model/pen.model';
import { HSV, RGB } from 'src/app/model/color-formats.model';

@Component({
  selector: 'pen-settings-menu',
  templateUrl: './pen-settings-menu.component.html',
  styleUrls: ['./pen-settings-menu.component.css', '../../../../styles.css'],
})
export class PenSettingsMenu {
  @Input() public penProperties: PenProperties = new PenProperties();
  @Output() public penPropertiesChange = new EventEmitter<PenProperties>();

  @Input() public isOpen: boolean = false;

  @Input() public preferredPosition: {
    top: number;
    left: number;
  } = { top: 295, left: 0 };

  @ViewChild('menuElement', { static: true })
  menuElementRef!: ElementRef<HTMLDivElement>;

  @ViewChild('penPreviewElement', { static: true })
  penPreviewElementRef!: ElementRef<HTMLDivElement>;

  protected colorHSV = new HSV();
  private colorRGB = new RGB();
  protected opacity: number = 100;

  private minimumScreenHeight: number = 375;
  private minimumScreenWidth: number = 667;

  private originalMenuHeight: number = 0;

  ngOnInit(): void {
    this.colorHSV = HSV.fromHex(this.penProperties.color);
    this.opacity = this.penProperties.opacity;
  }

  // protected calculatedTop(): number {
  //   if (!this.isOpen) {
  //     return this.preferredPosition.top;
  //   }

  //   // console.log(this.menuElementRef.nativeElement.clientTop);

  //   let calculatedTop = this.preferredPosition.top;

  //   const halfMenuHeight = this.originalMenuHeight / 2;
  //   const windowHeight = window.innerHeight;

  //   let topOffset = calculatedTop - halfMenuHeight;
  //   if (topOffset < 0) {
  //     calculatedTop += topOffset;
  //   }

  //   let bottomOffset = calculatedTop + halfMenuHeight;
  //   if (bottomOffset > windowHeight) {
  //     calculatedTop += bottomOffset - windowHeight;
  //   }

  //   return calculatedTop;
  // }

  // protected calculatedLeft(): number {
  //   const calculatedLeft = this.preferredPosition.left;
  //   const menuWidth = this.menuElementRef.nativeElement.offsetWidth;
  //   const windowWidth = window.innerWidth;
  //   // Check if the menu exceeds the right side of the window
  //   if (calculatedLeft + menuWidth > windowWidth) {
  //     return windowWidth - menuWidth; // Adjust the left position to fit inside the window
  //   }
  //   return calculatedLeft;
  // }

  // protected calcularedHeight(): number {
  //   const windowHeight = window.innerHeight;

  //   return this.originalMenuHeight;

  //   return this.originalMenuHeight > windowHeight
  //     ? this.minimumScreenHeight
  //     : this.originalMenuHeight;
  // }

  protected onColorPickerMouseDown(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected onColorPickerTouchStart(event: TouchEvent): void {
    event.stopPropagation();
  }

  public onPenPropertiesChange(): void {
    const penPreview = this.penPreviewElementRef.nativeElement;
    penPreview.style.stroke = `rgba(${this.colorRGB.red}, ${this.colorRGB.green}, ${this.colorRGB.blue}, ${this.penProperties.opacity / 100})`;
    penPreview.style.strokeWidth = `${this.penProperties.thickness}px`;

    this.penPropertiesChange.emit(this.penProperties);
  }

  protected selectedPenTypeChange(typeString: string): void {
    this.penProperties.type = typeString as PenType;

    if (this.penProperties.type === PenType.Highlighter) {
      this.penProperties.opacity = 50;
      this.penProperties.thickness = 20;
    } else {
      this.penProperties.opacity = 100;
      this.penProperties.thickness = 3;
    }

    this.onPenPropertiesChange();
  }

  protected onColorChange(color: HSV): void {
    this.colorHSV = color;
    this.colorRGB = color.toRGB();
    this.penProperties.color = color.toHex();

    this.onPenPropertiesChange();
  }

  protected onOpacityChange(opacity: number): void {
    this.opacity = opacity;
    this.penProperties.opacity = opacity;

    this.onPenPropertiesChange();
  }

  protected onThicknessChange(thickness: number): void {
    this.penProperties.thickness = thickness;

    this.onPenPropertiesChange();
  }

  protected getPreviewPenPath(): string {
    switch (this.penProperties.type) {
      case PenType.Pen:
        return 'M31.877,407.063s-6.189,15.134,0,15.711,34.169-22.124,39.6-16.927-7.916,25.888.77,27.666,42.575-36.785,50.011-30.852-8.276,28.591-1.318,33.56,31.122-12.9,52.918-35.917';
      case PenType.Highlighter:
        return 'M32.082,424.868c22.809,3.753,32.575-14.812,49.407-14.029s22.627,10.3,34.976,15.282,28.386,5.238,50.183-17.783';
      case PenType.LaserPointer:
        return 'M31.877,407.063s-6.189,15.134,0,15.711,34.169-22.124,39.6-16.927-7.916,25.888.77,27.666,42.575-36.785,50.011-30.852-8.276,28.591-1.318,33.56,31.122-12.9,52.918-35.917';
      default:
        return '';
    }
  }
}
