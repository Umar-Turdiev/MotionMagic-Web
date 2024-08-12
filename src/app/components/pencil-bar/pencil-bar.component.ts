import { Component, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { Pair } from 'src/app/model/pair';
import { PenType, PenProperties } from 'src/app/model/pen.model';

import { SelectedPenSharedService } from 'src/app/services/selected-pen.shared.service';

@Component({
  selector: 'pencil-bar',
  templateUrl: './pencil-bar.component.html',
  styleUrls: ['./pencil-bar.component.css', '../../../styles.css'],
})
export class PencilBarComponent {
  constructor(private selectedPenSharedService: SelectedPenSharedService) {}

  @Output() selectedPenIdChanged = new EventEmitter<number>();

  public selectedPenToolId: number = -1;

  public eraserProperties: PenProperties = new PenProperties(
    '#000000',
    0,
    0,
    PenType.Eraser,
  );

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.selectedPenToolId = this.pens[0].first;
      this.onPenSelectionChange(this.selectedPenToolId); // Select first pen by default.
    });
  }

  public pens: Pair<number, PenProperties>[] = [
    new Pair(0, new PenProperties('#ffffff', 3, 100)),
    new Pair(1, new PenProperties('#35bff2', 3, 100)),
    new Pair(2, new PenProperties('#ff9300', 3, 100)),
    new Pair(3, new PenProperties('#ff514a', 3, 100, PenType.LaserPointer)),
    new Pair(4, new PenProperties('#26d53a', 3, 100, PenType.LaserPointer)),
    new Pair(5, new PenProperties('#ffc400', 20, 50, PenType.Highlighter)),
    new Pair(6, new PenProperties('#ea60af', 20, 50, PenType.Highlighter)),
  ];

  public onPenPropertiesChange(penProperties: PenProperties) {
    let selectedPair = this.pens.find(
      (pair) => pair.first === this.selectedPenToolId,
    );

    if (selectedPair) {
      selectedPair.second = penProperties;
    }

    this.selectedPenSharedService.setPenProperties(penProperties);
  }

  public onPenSelectionChange(penId: number) {
    this.selectedPenToolId = penId;

    let selectedPair = this.pens.find(
      (pair) => pair.first === this.selectedPenToolId,
    );

    // -10 is a special id for the eraser.
    if (this.selectedPenToolId !== -10) {
      this.selectedPenSharedService.setPenProperties(selectedPair!.second);
    } else {
      this.selectedPenSharedService.setPenProperties(this.eraserProperties);
    }
  }

  public penDropped(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.pens, event.previousIndex, event.currentIndex);
  }
}
