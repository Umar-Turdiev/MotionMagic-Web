import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

/* Scene Related */
import { SceneParserService } from 'src/app/services/scene-parser.service';
import { Scene, SceneObject } from 'src/app/model/scene.model';
import { SceneObjectsSharedService } from 'src/app/services/scene-objects-shared.service';

/* Construction Cursor */
import { ConstructionCursorMode } from 'src/app/model/construction-cursor-mode.model';
import { ConstructionCursorModeSharedService } from 'src/app/services/construction-cursor-mode-shared.service';

/* Viewport Related */
import { ViewportMode } from 'src/app/model/viewport-mode.model';
import { ViewportModeSharedService } from 'src/app/services/viewport-mode-shared.service';
import { ViewportTransformSharedService } from 'src/app/services/viewport-transform.shared.service';

/* Object Actions */
import { ObjectActionsSharedService } from 'src/app/services/object-actions.shared.service';

@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrl: './simulator.component.css',
})
export class SimulatorComponent {
  @ViewChild('zoomIndicator') zoomIndicatorElementRef!: ElementRef;

  private unsubscribe = new Subject<void>();

  isLoggedIn: boolean = false;
  isSolverOpen: boolean = false;

  private jsonUrl = '../../assets/test-scene.json';
  private scene!: Scene;
  private sceneObjects!: Map<string, SceneObject>;

  private zoomIndicatorTimeoutId?: any;

  public currentViewportMode = ViewportMode.Construction;

  constructor(
    private sceneParserService: SceneParserService,
    private sceneObjectsSharedService: SceneObjectsSharedService,
    private viewportTransformSharedService: ViewportTransformSharedService,
    private viewportModesSharedService: ViewportModeSharedService,
    private constructionCursorModeSharedService: ConstructionCursorModeSharedService,
    private objectActionsSharedService: ObjectActionsSharedService
  ) {}

  ngOnInit(): void {
    document.body.style.overflow = 'hidden'; // Disable overflow when entering the component

    this.sceneParserService.parseSceneJson(this.jsonUrl).subscribe(
      (data) => {
        this.scene = data;
        this.sceneObjects = new Map<string, SceneObject>(
          Object.entries(this.scene.objects).map(([key, value]) => [key, value])
        );
        this.sceneObjectsSharedService.setSceneObjects(this.sceneObjects);
      },
      (error) => {
        console.error('Error parsing scene JSON', error);
      }
    );

    this.viewportModesSharedService
      .getCurrentMode$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((viewportMode) => {
        if (viewportMode !== this.currentViewportMode) {
          this.currentViewportMode = viewportMode;

          // Set the cursor mode to select when exited from construction mode.
          if (viewportMode !== ViewportMode.Construction) {
            this.constructionCursorModeSharedService.setCurrentMode(
              ConstructionCursorMode.Select
            );
          }
        }
      });

    this.sceneObjectsSharedService
      .getSceneObjects$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (this.sceneObjects !== data) {
          this.sceneObjects = data;
        }
      });

    this.viewportTransformSharedService
      .getZoomPercentage$()
      .subscribe((zoomLevel) => {
        const zoomIndicatorElement = this.zoomIndicatorElementRef.nativeElement;
        zoomIndicatorElement.innerText = (zoomLevel * 100).toFixed(0) + '%';
        zoomIndicatorElement.classList.add('active');

        clearTimeout(this.zoomIndicatorTimeoutId);

        this.zoomIndicatorTimeoutId = setTimeout(() => {
          zoomIndicatorElement.classList.remove('active');
        }, 1000);
      });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'auto'; // Re-enable overflow when leaving the component
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.currentViewportMode === ViewportMode.Construction) {
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLocaleLowerCase() === 'a') {
          this.objectActionsSharedService.sendSelectAllSignal();
          event.preventDefault();
        }

        if (event.key.toLocaleLowerCase() === 'c') {
          this.objectActionsSharedService.sendCopySignal();
          event.preventDefault();
        }

        if (event.key.toLocaleLowerCase() === 'x') {
          this.objectActionsSharedService.sendCutSignal();
          event.preventDefault();
        }

        if (event.key.toLocaleLowerCase() === 'v') {
          this.objectActionsSharedService.sendPasteSignal();
          event.preventDefault();
        }

        if (event.key.toLocaleLowerCase() === 'd') {
          this.objectActionsSharedService.sendDuplicateSignal();
          event.preventDefault();
        }

        if (event.key.toLocaleLowerCase() === 'z') {
          this.objectActionsSharedService.sendUndoSignal();
          event.preventDefault();
        }

        if (
          event.key.toLocaleLowerCase() === 'y' ||
          (event.shiftKey && event.key.toLocaleLowerCase() === 'z')
        ) {
          this.objectActionsSharedService.sendRedoSignal();
          event.preventDefault();
        }
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        this.objectActionsSharedService.sendDeleteSignal();
        event.preventDefault();
      }

      if (event.key === '.') {
        this.viewportTransformSharedService.sendViewportTransfromSignal();
        event.preventDefault();
      }
    }
  }

  openSolver() {
    this.isSolverOpen = true;
  }

  closeSolver() {
    this.isSolverOpen = false;
  }
}
