import { Component, ElementRef, HostListener } from '@angular/core';

import { ViewportTransformSharedService } from 'src/app/services/viewport-transform.shared.service';

import { ViewportMode } from 'src/app/model/viewport-mode.model';
import { ViewportModeSharedService } from 'src/app/services/viewport-mode-shared.service';

import { ObjectActionsSharedService } from 'src/app/services/object-actions.shared.service';

@Component({
  selector: 'menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css', '../../../styles.css'],
})
export class MenuBarComponent {
  constructor(
    private viewportTransformSharedService: ViewportTransformSharedService,
    private viewportModesSharedService: ViewportModeSharedService,
    private objectActionsSharedService: ObjectActionsSharedService,
    private elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
    this.viewportModesSharedService.setCurrentMode(this.selectedMode);
  }

  showDropdown: { [key: string]: boolean } = {};
  activeTab: string | null = null;
  selectedMode: ViewportMode = ViewportMode.Construction;

  closeAllDropdownExcept(menu: string): void {
    // Close all other except 'menu' dropdowns.
    Object.keys(this.showDropdown).forEach((key) => {
      if (key !== menu) {
        this.showDropdown[key] = false;
      }
    });
  }

  toggleDropdown(menu: string): void {
    this.closeAllDropdownExcept(menu);
    this.showDropdown[menu] = !this.showDropdown[menu];
    this.activeTab = this.showDropdown[menu] ? menu : null;
  }

  openDropdown(menu: string): void {
    if (this.activeTab !== null) {
      this.closeAllDropdownExcept(menu);
      this.showDropdown[menu] = true;
      this.activeTab = this.showDropdown[menu] ? menu : null;
    }
  }

  onModeChange() {
    if (this.selectedMode) {
      this.viewportModesSharedService.setCurrentMode(this.selectedMode);
    }
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchend', ['$event'])
  handleDocumentClick(event: Event): void {
    // Close dropdowns if the click or tap is outside the menu.
    if (!this.elementRef.nativeElement.contains(event.target)) {
      Object.keys(this.showDropdown).forEach((key) => {
        this.showDropdown[key] = false;
      });

      this.activeTab = null; // Remove active tab when closing dropdowns.
    }
  }

  onEditButtonPress(functionName: string) {
    switch (functionName){
      case 'cut':
        this.objectActionsSharedService.sendCutSignal();
        break;
      case 'copy':
        this.objectActionsSharedService.sendCopySignal();
        break;
      case 'paste':
        this.objectActionsSharedService.sendPasteSignal();
        break;
      case 'duplicate':
        this.objectActionsSharedService.sendDuplicateSignal();
        break;
      case 'delete':
        this.objectActionsSharedService.sendDeleteSignal();
        break;
      case 'undo':
        this.objectActionsSharedService.sendUndoSignal();
        break;
      case 'redo':
        this.objectActionsSharedService.sendRedoSignal();
        break;
      case 'selectAll':
        this.objectActionsSharedService.sendSelectAllSignal();
        break;
      case 'group':
        console.log('This feature isn\'t supported currently');
        break;
      case 'ungroup':
        console.log('This feature isn\'t supported currently');
        break;
      default:
        break;
    }
  }

  onViewButtonPress(functionName: string) {
    switch (functionName){
      case '100%':
        this.viewportTransformSharedService.setZoomPercentage(1);
        break;
      case 'zoomIn':
        this.viewportTransformSharedService.sendAdjustZoomPercentageSignal(0.5);
        break;
      case 'zoomOut':
        this.viewportTransformSharedService.sendAdjustZoomPercentageSignal(-0.5);
        break;
      case 'pan':
        this.viewportTransformSharedService.sendViewportTransfromSignal();
        break;
      default:
        break;
    }
  }
}
