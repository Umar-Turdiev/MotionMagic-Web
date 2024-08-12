import { Component } from '@angular/core';
import { takeUntil, Subject } from 'rxjs';

import { ConstructionCursorMode } from 'src/app/model/construction-cursor-mode.model';
import { ConstructionCursorModeSharedService } from 'src/app/services/construction-cursor-mode-shared.service';

import { ObjectActionsSharedService } from 'src/app/services/object-actions.shared.service';

@Component({
  selector: 'edit-toolbar',
  templateUrl: './edit-toolbar.component.html',
  styleUrls: ['./edit-toolbar.component.css', '../../../styles.css'],
})
export class EditToolbarComponent {
  private unsubscribe = new Subject<void>();

  public currentConstructionCursorMode = ConstructionCursorMode.Select;

  constructor(
    private constructionCursorModeSharedService: ConstructionCursorModeSharedService,
    private objectActionsSharedService: ObjectActionsSharedService,
  ) {}

  protected ngOnInit(): void {
    this.constructionCursorModeSharedService
      .getCurrentMode$()
      .subscribe((mode: ConstructionCursorMode) => {
        if (mode !== this.currentConstructionCursorMode) {
          this.currentConstructionCursorMode = mode;
        }
      });

    this.constructionCursorModeSharedService.setCurrentMode(
      this.currentConstructionCursorMode,
    );
  }

  protected ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  protected onConstructionCursorModeChange(): void {
    if (this.currentConstructionCursorMode) {
      this.constructionCursorModeSharedService.setCurrentMode(
        this.currentConstructionCursorMode,
      );
    }
  }

  protected onUndoButtonPress(): void {
    this.objectActionsSharedService.sendUndoSignal();
  }

  protected onRedoButtonPress(): void {
    this.objectActionsSharedService.sendRedoSignal();
  }

  protected onCopyButtonPress(): void {
    this.objectActionsSharedService.sendCopySignal();
  }

  protected onPasteButtonPress(): void {
    this.objectActionsSharedService.sendPasteSignal();
  }

  protected onDuplicateButtonPress(): void {
    this.objectActionsSharedService.sendDuplicateSignal();
  }

  protected onCutButtonPress(): void {
    this.objectActionsSharedService.sendCutSignal();
  }

  protected onDeleteButtonPress(): void {
    this.objectActionsSharedService.sendDeleteSignal();
  }
}
