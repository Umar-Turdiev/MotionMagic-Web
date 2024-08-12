import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { PenProperties, PenType } from 'src/app/model/pen.model';
import { HSV, HSL, RGB } from 'src/app/model/color-formats.model';

@Component({
  selector: 'pen',
  templateUrl: './pen.component.html',
  styleUrls: ['./pen.component.css', '../../../../styles.css'],
})
export class PenComponent {
  @Input() public penId: number = -1;
  @Input() public selected: boolean = false;

  @Input() public penProperties: PenProperties = new PenProperties();
  @Output() public penPropertiesChange = new EventEmitter<PenProperties>();

  @ViewChild('penPreviewElement', { static: true })
  penPreviewElementRef!: ElementRef<HTMLDivElement>;

  protected menuOpened: boolean = false;

  constructor(private elementRef: ElementRef) {}

  protected onPenPropertiesChange(penProperties: PenProperties): void {
    this.penProperties = penProperties;
    this.penPropertiesChange.emit(this.penProperties);
  }

  // Close the menu when clicking outside.
  @HostListener('document:mousedown', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  private hadelDocumentClick(event: MouseEvent): void {
    // NOTE: This is obsolute now since the dragging will keep the menu open.
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    // const isParentRadio =
    //   (event.target as HTMLElement).nodeName === 'INPUT' &&
    //   (event.target as HTMLInputElement).name === 'selectedPenTool' &&
    //   (event.target as HTMLInputElement).id == this.penId.toString();

    // if (!clickedInside) {
    //   this.menuOpened = false;
    // }

    this.menuOpened = false;
  }

  protected onClick(event: Event): void {
    if (!this.selected || this.penProperties.type === PenType.Eraser) {
      return;
    }

    this.menuOpened = !this.menuOpened;
  }
}
