import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'base-panel',
  templateUrl: './base-panel.component.html',
  styleUrls: ['./base-panel.component.css', '../../../styles.css'],
})
export class BasePanelComponent {
  @Input() title: string = 'Panel'; // Default title

  @ViewChild('content') contentElement!: ElementRef<HTMLDivElement>;

  protected isCollapsed: boolean = false;

  protected toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;

    console.log('clicked');
  }

  public scrollToBottom(duration: number = 250) {
    const startPosition = this.contentElement.nativeElement.scrollTop;
    const endPosition = this.contentElement.nativeElement.scrollHeight;
    const distance = endPosition - startPosition;
    const startTime = performance.now();

    const scrollAnimation = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const scrollAmount = this.easeInOut(
        elapsedTime,
        startPosition,
        distance,
        duration,
      );

      this.contentElement.nativeElement.scrollTop = scrollAmount;
      if (elapsedTime < duration) {
        setTimeout(() => {
          requestAnimationFrame(scrollAnimation);
        }, 0);
      }
    };

    requestAnimationFrame(scrollAnimation);
  }

  private easeInOut(t: number, b: number, c: number, d: number) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }
}
