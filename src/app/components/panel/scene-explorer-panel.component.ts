import { Component, AfterViewInit, HostListener } from '@angular/core';
import { BasePanelComponent } from './base-panel.component';

import { SceneObject } from 'src/app/model/scene.model';
import { Pair } from 'src/app/model/pair';

import { SceneObjectsSharedService } from 'src/app/services/scene-objects-shared.service';
import { SelectedObjectPropertiesSharedService } from 'src/app/services/selected-object-properties-shared.service';

@Component({
  selector: 'scene-explorer-panel',
  templateUrl: './scene-explorer-panel.component.html',
  styleUrls: [
    './scene-explorer-panel.component.css',
    './base-panel.component.css',
    '../../../styles.css',
  ],
})
export class SceneExplorerPanelComponent extends BasePanelComponent {
  public items: Pair<string, string>[] = [];

  private selectedItems: any[] = [];
  private shiftKeyPressed: boolean = false;
  private ctrlKeyPressed: boolean = false;

  constructor(
    private sceneObjectsSharedService: SceneObjectsSharedService,
    private selectedObjectPropertiesSharedService: SelectedObjectPropertiesSharedService,
  ) {
    super();

    // Add event listener for shift keydown and keyup.
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.onKeyUp(event));
  }

  ngAfterViewInit() {
    this.sceneObjectsSharedService
      .getSceneObjectIdNamePairs()
      .subscribe((sceneObjectIdNamePairs) => {
        this.items = sceneObjectIdNamePairs;
      });

    this.sceneObjectsSharedService
      .getNewObjectAddedSignal$()
      .subscribe((data: { id: string; sceneObject: SceneObject }) => {
        const pair: Pair<string, string> = new Pair(
          data.id,
          data.sceneObject.name,
        );
        this.items.push(pair);
        //I don't really understand how the return part works, but it sort it by.
        // this.items.sort((pair1, pair2) => {
        //   return pair1.first - pair2.first;
        // });
      });

    this.sceneObjectsSharedService
      .getRemoveObjectSignal$()
      .subscribe((id: string) => {
        let index = this.items
          .map((item) => {
            return item.first;
          })
          .indexOf(id);
        this.items.splice(index, 1);
        this.selectedItems = [];
      });

    this.selectedObjectPropertiesSharedService
      .getPropertyChangedSignal$()
      .subscribe(() => {
        this.items.forEach((pair) => {
          let index = this.items.indexOf(pair);
          let newObj = this.sceneObjectsSharedService.getSceneObjectById(
            pair.first,
          );
          if (newObj?.name !== pair.second) {
            this.items[index].second = newObj?.name!;
          }
        });
      });

    this.selectedObjectPropertiesSharedService
      .getSelectedObjectId$()
      .subscribe((ids) => {
        if (ids !== this.selectedItems) {
          this.selectedItems = ids;
        }
      });
  }

  @HostListener('window:blur', ['$event'])
  onBlur(event: FocusEvent): void {
    // Reset key pressed when the app lost focus.
    this.shiftKeyPressed = false;
    this.ctrlKeyPressed = false;
  }

  onMouseDown(event: MouseEvent, itemId: string) {
    // Check if left mouse button is pressed.
    if (event.button === 0) {
      this.selectItemsRange(itemId);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      this.shiftKeyPressed = true;
    }
    if (event.key === 'Control' || event.key === 'Meta') {
      this.ctrlKeyPressed = true;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      this.shiftKeyPressed = false;
    }
    if (event.key === 'Control' || event.key === 'Meta') {
      this.ctrlKeyPressed = false;
    }
  }

  // Toggle selection of a single item.
  toggleSelection(itemId: string) {
    const index = this.selectedItems.indexOf(itemId);

    if (index === -1) {
      this.selectedItems.push(itemId);
    } else {
      this.selectedItems.splice(index, 1);
    }
  }

  selectItemsRange(itemId: string) {
    if (this.shiftKeyPressed) {
      // Select items range.
      const firstIndex = this.items.findIndex(
        (pair) => pair.first === this.selectedItems[0],
      );
      const lastIndex = this.items.findIndex((pair) => pair.first === itemId);

      if (firstIndex !== -1 && lastIndex !== -1) {
        if (firstIndex <= lastIndex) {
          this.selectedItems = this.items
            .slice(firstIndex, lastIndex + 1)
            .map((pair) => pair.first);
        } else {
          this.selectedItems = this.items
            .slice(lastIndex, firstIndex + 1)
            .map((pair) => pair.first)
            .reverse();
        }
      }
    } else if (this.ctrlKeyPressed) {
      // Multi-selection.
      this.toggleSelection(itemId);
    } else {
      // Single-selection.
      this.selectedItems = [itemId];
    }
    this.selectedObjectPropertiesSharedService.setSelectedObjectId(
      this.selectedItems,
    );
  }

  isItemSelected(itemId: string): boolean {
    return this.selectedItems.includes(itemId);
  }
}
