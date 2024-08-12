import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { fabric } from 'fabric';
import { Point } from 'fabric/fabric-impl';

import {
  Rectangle,
  Circle,
  Polygon,
  SceneObject,
  ObjectType,
} from 'src/app/model/scene.model';

import { ViewportRendererService } from './viewport-renderer.service';
import { ViewportMode } from 'src/app/model/viewport-mode.model';

import { PenType, PenProperties } from 'src/app/model/pen.model';

import { SceneObjectsSharedService } from 'src/app/services/scene-objects-shared.service';
import { SelectedObjectPropertiesSharedService } from 'src/app/services/selected-object-properties-shared.service';
import { ViewportEventSharedService } from 'src/app/services/viewport-event-shared-service';
import { ViewportTransformSharedService } from 'src/app/services/viewport-transform.shared.service';
import { WorldOriginSharedService } from 'src/app/services/world-origin.shared.service';
import { WorldOriginUtil } from './world-origin.util';
import { ConstructionCursorService } from './construction-cursor.service';

import { ConstructionCursorMode } from 'src/app/model/construction-cursor-mode.model';
import { ConstructionCursorModeSharedService } from 'src/app/services/construction-cursor-mode-shared.service';
import { ViewportModeSharedService } from 'src/app/services/viewport-mode-shared.service';
import { SelectedPenSharedService } from 'src/app/services/selected-pen.shared.service';
import { HexOpacityConverterService } from 'src/app/services/hex-opacity-converter.service';

import { ObjectActionsSharedService } from 'src/app/services/object-actions.shared.service';
import { ModificationType } from 'src/app/model/object-modification-record.model';
import * as RecordValue from 'src/app/model/record-value.model';

@Component({
  selector: 'viewport',
  templateUrl: './viewport.component.html',
  styleUrls: ['./viewport.component.css'],
})
export class ViewportComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  private unsubscribe = new Subject<void>();

  private selectedViewportObject = new fabric.Object();

  private canvas!: fabric.Canvas;

  /* Panning */
  private isPanning: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;
  private momentumPanShouldStop: boolean = false;
  private allowOneFingerPanning: boolean = true;

  /* Zooming */
  private maximumZoom: number = 2.5;
  private minimumZoom: number = 0.25;
  private previousZoom: number = 0;

  private wasFingerGesture: boolean = false;

  private selectedObjects: SceneObject[] = [];

  private selectedIds: string[] = [];

  private clipboardIDs: string[] = [];
  private clipboardOffsets: number = 0;
  private cutSceneObjects: SceneObject[] = [];
  private isCutMode: boolean = false;
  private lastAcitveSelectionPosition: { x: number; y: number } = {
    x: 0,
    y: 0,
  };
  private currentMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private hasMouseMove: boolean = true;

  private originalRotation: number = 0;
  private tempObjectRecord: SceneObject[] = [];
  private tempModifyValueRecord: RecordValue.RecordsValue = false;
  private tempModifyTypeRecord!: ModificationType;
  private currentRecordType!: ModificationType;

  //Unused scale function value
  private wasRecordXFlipped: number = 1; // 1 means didn't flip, -1 means it fliped.
  private wasRecordYFlipped: number = 1; // 1 means didn't flip, -1 means it fliped.
  private wasObjectXFlipped: number = 1; // 1 means didn't flip, -1 means it fliped.
  private wasObjectYFlipped: number = 1; // 1 means didn't flip, -1 means it fliped.

  private isFirstFrameEditing: boolean = true;

  private currentConstructionCursorMode!: ConstructionCursorMode;
  private currentViewportMode: ViewportMode = ViewportMode.Construction;

  private isMouseDown: boolean = false;

  private penProperties: PenProperties = new PenProperties();
  private normalStrokeGroup = new fabric.Group([], {
    selectable: false,
    objectCaching: false,
  });
  private laserStrokeGroup = new fabric.Group([], {
    selectable: false,
  });
  private isLaserFadeAborted: boolean = false;

  constructor(
    private sceneObjectsSharedService: SceneObjectsSharedService,
    private selectedObjectPropertiesSharedService: SelectedObjectPropertiesSharedService,
    private viewportRendererService: ViewportRendererService,
    private viewportEventSharedService: ViewportEventSharedService,
    private viewportTransformSharedService: ViewportTransformSharedService,
    private constructionCursorModeSharedService: ConstructionCursorModeSharedService,
    private viewportModeSharedService: ViewportModeSharedService,
    private selectedPenSharedService: SelectedPenSharedService,
    private objectActionsSharedService: ObjectActionsSharedService,
    private worldOriginSharedService: WorldOriginSharedService,
    private constructionCursorService: ConstructionCursorService
  ) {}

  ngOnInit() {
    /* Fabric JS Setup */
    this.fabricJSCanvasSetup();
    this.fabricJSObjectSetup();

    this.normalStrokeGroup.set({ perPixelTargetFind: true });

    /* Shared Service Setup */
    this.selectedObjectPropertiesSharedServiceSetup();
    this.constructionCursorModeSharedServiceSetup();
    this.viewportModeSharedServiceSetup();
    this.selectedPenSharedServiceSetup();
    this.viewportTransformSharedServiceSetup();

    /* Renderer Setup */
    this.viewportRendererService.initialize(this.canvas);

    this.objectActionsSharedServiceSetup();

    this.constructionCursorService.initialize(this.canvas);
  }

  ngOnDestroy() {
    this.canvas.dispose();
  }

  onResize() {
    this.canvas.setWidth(window.innerWidth);
    this.canvas.setHeight(window.innerHeight);
  }

  private beginCanvasPanAt(panX: number, panY: number) {
    this.isPanning = true;
    this.lastPanX = panX;
    this.lastPanY = panY;
  }

  private panCanvasBy(x: number, y: number) {
    if (this.isPanning) {
      const vpt = this.canvas.viewportTransform || [];

      if (vpt.length === 0) {
        vpt[4] = 0;
        vpt[5] = 0;
      }

      const sensitivity = 0.999 ** this.canvas.getZoom();

      const deltaX = x - this.lastPanX;
      const deltaY = y - this.lastPanY;

      vpt[4] += deltaX * sensitivity;
      vpt[5] += deltaY * sensitivity;

      this.canvas.setViewportTransform(vpt);
      this.canvas.requestRenderAll();

      this.lastPanX = x;
      this.lastPanY = y;
    }
  }

  private inertialPan(finalPanVelocityX: number, finalPanVelocityY: number) {
    if (this.isPanning) {
      this.isPanning = false;
      this.momentumPanShouldStop = false;

      const momentumMultiplier = 30;
      const decelerationFactor = 0.94;

      finalPanVelocityX *= momentumMultiplier;
      finalPanVelocityY *= momentumMultiplier;

      const inertialPanLoop = () => {
        let vpt = this.canvas.viewportTransform || [];

        vpt[4] += finalPanVelocityX;
        vpt[5] += finalPanVelocityY;

        this.canvas.setViewportTransform(vpt);
        this.canvas.requestRenderAll();

        finalPanVelocityX *= decelerationFactor;
        finalPanVelocityY *= decelerationFactor;

        if (this.momentumPanShouldStop) return;

        if (
          Math.abs(finalPanVelocityX) > 0.1 ||
          Math.abs(finalPanVelocityY) > 0.1
        ) {
          requestAnimationFrame(inertialPanLoop);
        }
      };

      inertialPanLoop();
    }
  }

  private canvasZoomToPoint(x: number, y: number, zoom: number) {
    if (zoom > this.maximumZoom) zoom = this.maximumZoom;
    if (zoom < this.minimumZoom) zoom = this.minimumZoom;
    this.canvas.zoomToPoint({ x: x, y: y }, zoom);
    this.viewportTransformSharedService.setZoomPercentage(zoom);
  }

  protected onPanStart(event: any) {
    if (event.pointerType === 'mouse') return;
    this.canvas.selection = false;

    if (this.currentConstructionCursorMode !== ConstructionCursorMode.Select)
      return;

    if (this.canvas.getActiveObjects().length > 0) return;

    if (!this.allowOneFingerPanning) return;

    this.beginCanvasPanAt(event.center.x, event.center.y);
  }

  protected onPanMove(event: any) {
    if (event.pointerType === 'mouse') return;

    if (!this.allowOneFingerPanning) return;

    this.panCanvasBy(event.center.x, event.center.y);
  }

  protected onPanEnd(event: any) {
    if (event.pointerType === 'mouse') return;
    this.canvas.selection = true;

    if (!this.allowOneFingerPanning) return;

    this.inertialPan(event.velocityX, event.velocityY);
  }

  protected onPinchStart(event: any) {
    if (this.currentConstructionCursorMode !== ConstructionCursorMode.Select)
      return;

    if (this.currentViewportMode === ViewportMode.Annotate) {
      this.wasFingerGesture = true;
      this.canvas.isDrawingMode = false;
    }

    this.canvas.selection = false;
    this.previousZoom = this.canvas.getZoom();

    this.beginCanvasPanAt(event.center.x, event.center.y);
  }

  protected onPinchZoom(event: any) {
    if (this.currentConstructionCursorMode !== ConstructionCursorMode.Select)
      return;

    let zoom = this.previousZoom * event.scale;
    this.canvasZoomToPoint(event.center.x, event.center.y, zoom);
  }

  protected onPinchMove(event: any) {
    this.panCanvasBy(event.center.x, event.center.y);
  }

  protected onPinchEnd(event: any) {
    if (this.currentConstructionCursorMode !== ConstructionCursorMode.Select)
      return;

    this.inertialPan(event.velocityX, event.velocityY);

    if (
      this.currentViewportMode === ViewportMode.Annotate &&
      this.penProperties.type !== PenType.Eraser
    ) {
      this.canvas.isDrawingMode = true;
    }
  }

  protected onPress(event: any) {
    this.momentumPanShouldStop = true;
  }

  private fabricJSCanvasSetup(): void {
    /* Canvas Property Setup */
    this.canvas = new fabric.Canvas(this.canvasRef.nativeElement);
    this.canvas.setWidth(window.innerWidth);
    this.canvas.setHeight(window.innerHeight);
    this.canvas.selectionColor = '#0080FE60';
    this.canvas.fireMiddleClick = true;
    this.canvas.skipOffscreen = false;
    this.canvas.uniformScaling = false;
    this.canvas.targetFindTolerance = 2;
    this.canvas.preserveObjectStacking = true;

    /* Event Handler Setup */
    this.canvas.on('mouse:down:before', this.beforeMouseDownHandler.bind(this));
    this.canvas.on('mouse:down', this.mouseDownHandler.bind(this));
    this.canvas.on('mouse:up', this.mouseUpHandler.bind(this));
    this.canvas.on('mouse:move', this.mouseMoveHandler.bind(this));
    this.canvas.on('mouse:wheel', this.mouseWheelHandler.bind(this));
    this.canvas.on(
      'before:selection:cleared',
      this.beforeSelectionClearedHandler.bind(this)
    );
    this.canvas.on(
      'selection:created',
      this.canvasSelectionCreatedHandler.bind(this)
    );
    this.canvas.on(
      'selection:updated',
      this.canvasSelectionUpdatedHandler.bind(this)
    );
    this.canvas.on(
      'selection:cleared',
      this.canvasSelectionClearedHandler.bind(this)
    );
    this.canvas.on('object:moving', this.objectMovingHandler.bind(this));
    this.canvas.on('object:rotating', this.objectRotatingHandler.bind(this));
    this.canvas.on('object:scaling', this.objectScalingHandler.bind(this));

    this.canvas.on('path:created', () => {
      const objects = this.canvas.getObjects();
      const latestPath = objects[objects.length - 1];
      latestPath.objectCaching = false;

      if (this.wasFingerGesture) {
        this.wasFingerGesture = false;
        this.canvas.remove(latestPath);

        return;
      }

      if (this.penProperties.type === PenType.LaserPointer) {
        this.laserStrokeGroup.addWithUpdate(latestPath);
        this.canvas.moveTo(this.laserStrokeGroup, 9999999);
        this.fadeOutAndClearGroup(this.laserStrokeGroup, 1500);
      } else {
        this.normalStrokeGroup.addWithUpdate(latestPath);
        this.canvas.moveTo(this.normalStrokeGroup, 99999);
      }

      this.canvas.remove(latestPath);
    });
  }

  private fabricJSObjectSetup(): void {
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerSize = 7.5;
    fabric.Object.prototype.cornerColor = '#FFFFFF';
    fabric.Object.prototype.cornerStrokeColor = '#0080FE';
    fabric.Object.prototype.cornerStyle = 'circle';
    fabric.Object.prototype.borderColor = '#0080FE';
  }

  private selectedObjectPropertiesSharedServiceSetup(): void {
    this.selectedObjectPropertiesSharedService
      .getPropertyChangedSignal$()
      .subscribe(() => {
        this.canvasUpdateActiveObjectVisuals();
      });
    this.selectedObjectPropertiesSharedService
      .getSelectedObjectId$()
      .subscribe((ids) => {
        if (ids !== this.selectedIds) {
          this.canvas.discardActiveObject();
          this.selectedIds = ids;
          this.selectedObjects = [];
          let objectsToSelect: fabric.Object[] = [];
          ids.forEach((id) => {
            this.selectedObjects.push(
              this.sceneObjectsSharedService.getSceneObjectById(id)!
            );
            objectsToSelect.push(
              ...this.canvas.getObjects().filter((obj) => {
                return obj.name! === id.toString();
              })
            );
          });
          let selection;
          if (objectsToSelect.length > 1) {
            selection = new fabric.ActiveSelection(objectsToSelect, {
              canvas: this.canvas,
            });
          } else {
            selection = objectsToSelect[0];
          }

          this.canvas.setActiveObject(selection);
          this.canvas.requestRenderAll();
        }
      });
  }

  private constructionCursorModeSharedServiceSetup(): void {
    this.constructionCursorModeSharedService
      .getCurrentMode$()
      .subscribe((mode: ConstructionCursorMode) => {
        if (mode !== this.currentConstructionCursorMode) {
          this.currentConstructionCursorMode = mode;
        }
      });
  }

  private viewportTransformSharedServiceSetup(): void {
    this.viewportTransformSharedService
      .getViewportTransformSignal$()
      .subscribe(() => {
        if (this.selectedViewportObject) {
          this.zoomToFitSelection();

          let zoom = this.canvas.getZoom();

          // "80" is the offset to center the viewport object little bit to the left
          let newX =
            this.selectedViewportObject.left! * zoom -
            this.canvas.width! / 2 +
            80;
          let newY =
            this.selectedViewportObject.top! * zoom - this.canvas.height! / 2;

          this.canvas.absolutePan(new fabric.Point(newX, newY));

          this.canvas.requestRenderAll();
        }
      });

    this.viewportTransformSharedService
      .getZoomPercentage$()
      .subscribe((value) => {
        if (value === this.canvas!.getZoom()) {
          return;
        }

        this.canvas.zoomToPoint(
          { x: this.canvas.getCenter().left, y: this.canvas.getCenter().top },
          value
        );
      });

    this.viewportTransformSharedService
      .getAdjustZoomPercentageSignal$()
      .subscribe((value) => {
        let zoom = this.canvas!.getZoom();
        zoom += value;
        if (zoom > this.maximumZoom) zoom = this.maximumZoom;
        if (zoom < this.minimumZoom) zoom = this.minimumZoom;
        this.canvas.zoomToPoint(
          { x: this.canvas.getCenter().left, y: this.canvas.getCenter().top },
          zoom
        );
        this.viewportTransformSharedService.setZoomPercentage(zoom);
      });
  }

  private viewportModeSharedServiceSetup(): void {
    this.viewportModeSharedService
      .getCurrentMode$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((viewportMode) => {
        if (viewportMode === this.currentViewportMode) return;

        this.currentViewportMode = viewportMode;

        switch (this.currentViewportMode) {
          case ViewportMode.Construction:
            this.viewportRendererService.stopSimulation();
            this.viewportRendererService.resetGraphics();
            this.allowSceneObjectControl(true); // Enable controls for all scene objects.

            break;

          case ViewportMode.Annotate:
            this.viewportRendererService.stopSimulation();
            this.viewportRendererService.resetGraphics();
            this.allowSceneObjectControl(false); // Enable controls for all scene objects.

            break;

          case ViewportMode.States:
            this.viewportRendererService.stopSimulation();
            this.viewportRendererService.resetGraphics();
            this.allowSceneObjectControl(false); // Disable controls for all scene objects.

            break;

          case ViewportMode.Simulation:
            this.allowSceneObjectControl(false); // Disable controls for all scene objects.
            this.viewportRendererService.resetSimulation();

            break;

          default:
            break;
        }

        if (this.currentViewportMode === ViewportMode.Annotate) {
          this.allowOneFingerPanning = false;
          this.canvas.isDrawingMode = true;
          this.canvas.add(this.normalStrokeGroup, this.laserStrokeGroup);
          this.canvas.renderAll();
        } else {
          this.allowOneFingerPanning = true;
          this.canvas.isDrawingMode = false;
          this.canvas.remove(this.normalStrokeGroup, this.laserStrokeGroup);
        }
      });
  }

  private allowSceneObjectControl(isEnabled: boolean) {
    /* Enable or disable controls for all scene objects */
    this.canvas.getObjects().forEach((element) => {
      // TODO: Unlock this for adjustment in the future.
      if (element.name === WorldOriginUtil.UUID) {
        return;
      }

      element.selectable = isEnabled;
    });

    /* Enable or disable selection on canvas and change mouse cursor */
    if (isEnabled) {
      this.canvas.selection = true;
      this.canvas.hoverCursor = 'move';
    } else {
      this.canvas.selection = false;
      this.canvas.discardActiveObject();
      this.canvas.hoverCursor = 'default';
      this.canvas.requestRenderAll(); // Refresh the canvas.
    }
  }

  private selectedPenSharedServiceSetup(): void {
    this.selectedPenSharedService
      .getPenProperties$()
      .subscribe((penProperties: PenProperties) => {
        this.penProperties = penProperties;
        this.updateCanvasPenProperties(penProperties);
      });
  }

  private objectActionsSharedServiceSetup(): void {
    this.objectActionsSharedService.getSelectAllSignal$().subscribe(() => {
      let allObjects = this.canvas.getObjects();
      let filteredObjects = allObjects.filter(
        (obj: any) => obj.name !== WorldOriginUtil.UUID
      );
      let selection = new fabric.ActiveSelection(filteredObjects, {
        canvas: this.canvas,
        originX: 'center',
        originY: 'center',
      });
      this.canvas.setActiveObject(selection);
      this.canvas.requestRenderAll();
    });

    this.objectActionsSharedService.getCopySignal$().subscribe(() => {
      this.clipboardIDs = []; // Clear the old clipboard IDs
      this.clipboardOffsets = 0;
      this.isCutMode = false;

      if (this.canvas.getActiveObjects().length > 0) {
        this.cutSceneObjects = []; //Clear here in case the user misclick and lost the objects

        this.lastAcitveSelectionPosition.x = this.selectedViewportObject.left!;
        this.lastAcitveSelectionPosition.y = this.selectedViewportObject.top!;

        this.canvas.getActiveObjects().forEach((element) => {
          this.clipboardIDs.push(element.name!);
        });
      }
    });

    this.objectActionsSharedService.getCutSignal$().subscribe(() => {
      this.clipboardIDs = [];
      this.clipboardOffsets = 0;
      if (this.canvas.getActiveObjects().length > 0) {
        this.isCutMode = true;
        this.cutSceneObjects = []; //Clear here in case the user misclick and lost the objects

        this.lastAcitveSelectionPosition.x = this.selectedViewportObject.left!;
        this.lastAcitveSelectionPosition.y = this.selectedViewportObject.top!;

        let objectsIndex: number[] = [];

        let selectedObjects = this.canvas.getActiveObjects();
        this.selectedIds.forEach((id) => {
          objectsIndex.push(
            this.sceneObjectsSharedService.getSceneObjectIndexById(id)
          );
        });
        selectedObjects
          .map((element) => {
            return element.name!;
          })
          .forEach((id) => {
            this.cutSceneObjects.push(
              this.sceneObjectsSharedService.getSceneObjectById(id)!
            );
            this.sceneObjectsSharedService.sendRemoveObjectSignal(id);
          });

        this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
          ModificationType.Remove,
          objectsIndex,
          this.selectedIds,
          this.selectedObjects
        );

        this.canvas.remove(...selectedObjects);
        this.canvas.discardActiveObject();
      }
    });

    this.objectActionsSharedService.getPasteSignal$().subscribe(() => {
      if (this.clipboardIDs.length > 0 || this.cutSceneObjects.length > 0) {
        /*
         * Here we get a set of ids from the unmodified scene objects,
         * and we will need this to see the set difference later
         */
        let originalSceneObjectIdSet: Set<string> = new Set(
          this.sceneObjectsSharedService.getSceneObjectIds()
        );

        if (this.hasMouseMove) {
          this.clipboardOffsets = 0;
          this.hasMouseMove = false;
        }

        let objectRecords: SceneObject[] = [];
        if (!this.isCutMode) {
          this.clipboardIDs.forEach((clipboardID) => {
            const originalSceneObject =
              this.sceneObjectsSharedService.getSceneObjectById(clipboardID);

            if (!originalSceneObject) {
              return;
            }

            let selectionOffsetX =
              originalSceneObject.position.x -
              this.lastAcitveSelectionPosition.x;
            let selectionOffsetY =
              originalSceneObject.position.y -
              this.lastAcitveSelectionPosition.y;

            let newSceneObject: SceneObject;

            newSceneObject = {
              ...originalSceneObject,

              position: {
                x:
                  this.currentMousePosition.x +
                  selectionOffsetX +
                  this.clipboardOffsets,
                y:
                  this.currentMousePosition.y +
                  selectionOffsetY +
                  this.clipboardOffsets,
              },
            };
            objectRecords.push(newSceneObject);
            this.sceneObjectsSharedService.addSceneObject(newSceneObject);
          });
        } else {
          this.cutSceneObjects.forEach((object) => {
            let selectionOffsetX =
              object.position.x - this.lastAcitveSelectionPosition.x;
            let selectionOffsetY =
              object.position.y - this.lastAcitveSelectionPosition.y;

            let newSceneObject: SceneObject;

            newSceneObject = {
              ...object,

              position: {
                x:
                  this.currentMousePosition.x +
                  selectionOffsetX +
                  this.clipboardOffsets,
                y:
                  this.currentMousePosition.y +
                  selectionOffsetY +
                  this.clipboardOffsets,
              },
            };
            objectRecords.push(newSceneObject);
            this.sceneObjectsSharedService.addSceneObject(newSceneObject);
          });
        }
        /*
         * After the new scene objects have been added,
         * we need to get a new set of ids from the modified scene objects list.
         */
        const modifiedSceneObjectIdSet: Set<string> = new Set(
          this.sceneObjectsSharedService.getSceneObjectIds()
        );

        /*
         * Get the difference between the original and modified scene object ids,
         * so we know which objects were added.
         */
        const sceneObjectSetDifference: Set<string> = new Set(
          [...modifiedSceneObjectIdSet].filter(
            (x) => !originalSceneObjectIdSet.has(x)
          )
        );

        this.canvas.discardActiveObject();

        /*
         * This is where we select the newly created objects.
         * We use the set difference to select all the newly created objects.
         */
        let objectsToSelect: fabric.Object[] = [];

        sceneObjectSetDifference.forEach((id) => {
          const matchingObjects = this.canvas
            .getObjects()
            .filter((obj) => obj.name === id.toString());
          objectsToSelect.push(...matchingObjects);
        });

        if (objectsToSelect.length > 1) {
          let selection = new fabric.ActiveSelection(objectsToSelect, {
            canvas: this.canvas,
            originX: 'center',
            originY: 'center',
          });

          this.canvas.setActiveObject(selection);
        } else {
          this.canvas.setActiveObject(objectsToSelect[0]);
        }

        this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
          ModificationType.Create,
          'None',
          [],
          objectRecords
        );

        this.canvas.requestRenderAll();

        this.clipboardOffsets += 10;
      }
    });

    this.objectActionsSharedService.getDeleteSignal$().subscribe(() => {
      let selectedObjects = this.canvas.getActiveObjects();
      let objectIndex: number[] = [];
      if (selectedObjects.length > 0) {
        this.selectedIds.forEach((id) => {
          objectIndex.push(
            this.sceneObjectsSharedService.getSceneObjectIndexById(id)
          );
        });
        selectedObjects.forEach((obj) => {
          this.sceneObjectsSharedService.sendRemoveObjectSignal(obj.name!);
        });

        this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
          ModificationType.Remove,
          objectIndex,
          this.selectedIds,
          this.selectedObjects
        );
        this.canvas.remove(...selectedObjects);
        this.canvas.discardActiveObject();
      }
    });

    this.objectActionsSharedService.getUndoSignal$().subscribe(() => {
      let recordData = this.sceneObjectsSharedService.getUndoRecordsSignal()!;
      if (!recordData) {
        return;
      }
      if (recordData.type === ModificationType.Create) {
        let createdObject = this.canvas.getObjects().filter((obj) => {
          return recordData.ids.includes(obj.name!);
        });
        this.canvas.remove(...createdObject);
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
        return;
      }
      if (
        recordData.type === ModificationType.SetName ||
        recordData.type === ModificationType.SetIsStatic ||
        recordData.type === ModificationType.SetMass ||
        recordData.type === ModificationType.SetStaticFriction ||
        recordData.type === ModificationType.SetKineticFriction ||
        recordData.type === ModificationType.SetLinearVelocityX ||
        recordData.type === ModificationType.SetLinearVelocityY ||
        recordData.type === ModificationType.SetHasFill ||
        recordData.type === ModificationType.SetHasBorder
      ) {
        this.selectedObjectPropertiesSharedService.sendPropertyChangedSignal();
        return;
      }
      this.viewportRecordProcessor(recordData);
    });

    this.objectActionsSharedService.getRedoSignal$().subscribe(() => {
      let recordData = this.sceneObjectsSharedService.getRedoRecordsSignal()!;
      if (!recordData) {
        return;
      }
      if (recordData.type === ModificationType.Create) {
        let createdObject = this.canvas.getObjects().filter((obj) => {
          return recordData.ids.includes(obj.name!);
        });

        if (createdObject.length > 1) {
          let selection = new fabric.ActiveSelection(createdObject, {
            canvas: this.canvas,
            originX: 'center',
            originY: 'center',
          });

          this.canvas.setActiveObject(selection);
        } else {
          this.canvas.setActiveObject(createdObject[0]);
        }

        this.canvas.requestRenderAll();
        return;
      }
      if (recordData.type === ModificationType.Remove) {
        let createdObject = this.canvas.getObjects().filter((obj) => {
          return recordData.ids.includes(obj.name!);
        });
        this.canvas.remove(...createdObject);
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
        return;
      }
      if (
        recordData.type === ModificationType.SetName ||
        recordData.type === ModificationType.SetIsStatic ||
        recordData.type === ModificationType.SetMass ||
        recordData.type === ModificationType.SetStaticFriction ||
        recordData.type === ModificationType.SetKineticFriction ||
        recordData.type === ModificationType.SetLinearVelocityX ||
        recordData.type === ModificationType.SetLinearVelocityY ||
        recordData.type === ModificationType.SetHasFill ||
        recordData.type === ModificationType.SetHasBorder
      ) {
        this.selectedObjectPropertiesSharedService.sendPropertyChangedSignal();
        return;
      }
      this.viewportRecordProcessor(recordData);
    });
    this.objectActionsSharedService
      .getDeveloperTestHotKeySignal$()
      .subscribe(() => {
        //For testing whatever what I need
      });
  }

  private beforeMouseDownHandler(option: any): void {
    // this.viewportEventSharedService.sendBeforeClickSignal();
  }

  private getCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
    const pointer = this.canvas.getPointer(event);

    return { x: pointer.x, y: pointer.y };
  }

  private mouseDownHandler(option: any): void {
    this.isMouseDown = true;
    const event = option.e;

    if (option.button === 2) {
      this.isPanning = true;
      this.canvas.selection = false;
      this.lastPanX = event.clientX;
      this.lastPanY = event.clientY;
      return;
    }

    if (this.currentConstructionCursorMode !== ConstructionCursorMode.Select) {
      this.constructionCursorService.beginConstruction(
        option.e,
        this.currentConstructionCursorMode
      );

      return;
    }

    if (this.canvas.isDrawingMode) {
      switch (this.penProperties.type) {
        case PenType.Eraser:
          this.eraseStroke(option.e);
          break;
        case PenType.LaserPointer:
          this.abortLaserStrokeFade();
          break;
        default:
          this.removeLaserStrokes();
          break;
      }
    }
  }

  private mouseMoveHandler(option: any): void {
    this.hasMouseMove = true;
    this.currentMousePosition = this.getCanvasCoordinates(option.e);

    if (this.constructionCursorService.isCreating) {
      this.constructionCursorService.constructObject(option.e);
    }

    if (this.penProperties.type === PenType.Eraser && this.isMouseDown) {
      this.eraseStroke(option.e);

      return;
    }
  }

  private mouseUpHandler(option: any): void {
    this.isMouseDown = false;
    this.isFirstFrameEditing = true;

    if (this.tempModifyValueRecord) {
      this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
        this.tempModifyTypeRecord,
        this.tempModifyValueRecord,
        this.selectedIds,
        this.tempObjectRecord
      );
      this.tempObjectRecord = [];
      this.tempModifyValueRecord = false as RecordValue.None;
      this.originalRotation = this.selectedViewportObject.angle!;
      //Unused scale function value
      // this.wasRecordXFlipped =
      // ( this.wasRecordXFlipped == -1 && this.selectedViewportObject.flipX )
      // || this.wasRecordXFlipped == 1 ?
      //  1 : -1;
      // this.wasRecordYFlipped =
      // ( this.wasRecordYFlipped == -1 && this.selectedViewportObject.flipY)
      // || this.wasRecordYFlipped == 1 ?
      //  1 : -1;
      //
    }
    //Unused scale function value
    // else{
    //   this.wasObjectXFlipped = this.selectedViewportObject.flipX? -1:1;
    //   this.wasObjectYFlipped = this.selectedViewportObject.flipY? -1:1;
    // }

    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.selection = true;

      return;
    }

    if (this.constructionCursorService.isCreating) {
      let newSceneObject: SceneObject | null =
        this.constructionCursorService.endConstruction();

      if (!newSceneObject) {
        return;
      }

      this.sceneObjectsSharedService.addSceneObject(newSceneObject);
      this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
        ModificationType.Create,
        'None',
        [],
        [newSceneObject]
      );

      return;
    }
  }

  private mouseWheelHandler(option: any) {
    option.e.preventDefault();
    option.e.stopPropagation();

    if (option.e.ctrlKey) {
      let delta = option.e.deltaY;
      let zoom = this.canvas!.getZoom();
      zoom *= 0.985 ** delta;
      if (zoom > this.maximumZoom) zoom = this.maximumZoom;
      if (zoom < this.minimumZoom) zoom = this.minimumZoom;
      this.canvas.zoomToPoint(
        { x: option.e.offsetX, y: option.e.offsetY },
        zoom
      );
      this.viewportTransformSharedService.setZoomPercentage(zoom);
    } else {
      let event = option.e;
      let vpt = this.canvas.viewportTransform;
      vpt![4] -= event.deltaX;
      vpt![5] -= event.deltaY;

      this.canvas.setViewportTransform(vpt!);
      this.canvas.requestRenderAll();
    }
  }

  private beforeSelectionClearedHandler(option: any) {
    this.viewportEventSharedService.sendBeforeClickSignal();
  }

  private canvasSelectionCreatedHandler(option: any) {
    this.canvasUpdateActiveObject();
    console.log('Selection created');
  }

  private canvasSelectionUpdatedHandler(option: any) {
    this.canvasUpdateActiveObject();
    console.log('Selection updated');
  }

  private canvasSelectionClearedHandler(option: any) {
    this.canvasClearActiveObject();
    console.log('Selection cleared');
  }

  private objectMovingHandler(option: any) {
    if (this.selectedViewportObject.name === WorldOriginUtil.UUID) {
      return;
    }

    if (this.selectedViewportObject) {
      const centerX: number = this.selectedViewportObject.left || 0;
      const centerY: number = this.selectedViewportObject.top || 0;
      let flipX = this.selectedViewportObject.flipX ? -1 : 1;
      let flipY = this.selectedViewportObject.flipY ? -1 : 1;

      const rad = fabric.util.degreesToRadians(
        this.selectedViewportObject.angle!
      );

      if (this.isFirstFrameEditing) {
        this.tempObjectRecord.push(...this.selectedObjects);
        this.isFirstFrameEditing = false;
      }

      let valueRecord: RecordValue.Move = { positions: [] };

      if (this.selectedViewportObject.type === 'activeSelection') {
        const scaleX = this.selectedViewportObject.scaleX;
        const scaleY = this.selectedViewportObject.scaleY;
        this.canvas.getActiveObjects().forEach((obj) => {
          let index = this.selectedIds.indexOf(obj.name!);
          let newX = obj.left! * Math.cos(rad) - obj.top! * Math.sin(rad);
          let newY = obj.left! * Math.sin(rad) + obj.top! * Math.cos(rad);
          this.selectedObjects[index] = {
            ...this.selectedObjects[index],
            position: {
              ...this.selectedObjects[index].position,
              x: centerX + newX * scaleX! * flipX,
              y: centerY + newY * scaleY! * flipY,
            },
          } as SceneObject;
          valueRecord.positions.push({
            x: centerX + newX * scaleX! * flipX,
            y: centerY + newY * scaleY! * flipY,
          });
        });
      } else {
        this.selectedObjects[0] = {
          ...this.selectedObjects[0],
          position: {
            ...this.selectedObjects[0].position,
            x: centerX,
            y: centerY,
          },
        } as SceneObject;
        valueRecord.positions.push({ x: centerX, y: centerY });
      }

      this.tempModifyTypeRecord = ModificationType.Move;
      this.tempModifyValueRecord = valueRecord;

      this.selectedObjectPropertyChanged();
    }
  }

  private objectRotatingHandler(option: any) {
    if (this.selectedViewportObject) {
      const degree: number = this.selectedViewportObject.angle || 0;
      const rad = fabric.util.degreesToRadians(
        this.selectedViewportObject.angle!
      );

      const scaleX = this.selectedViewportObject.scaleX;
      const scaleY = this.selectedViewportObject.scaleY;
      let flipX = this.selectedViewportObject.flipX ? -1 : 1;
      let flipY = this.selectedViewportObject.flipY ? -1 : 1;

      if (this.isFirstFrameEditing) {
        this.tempObjectRecord.push(...this.selectedObjects);
        this.isFirstFrameEditing = false;
      }

      let valueRecord: RecordValue.Rotate = { degreeOffset: 0, positions: [] };

      valueRecord.degreeOffset = degree - this.originalRotation;

      if (this.selectedViewportObject.type === 'activeSelection') {
        const centerX: number = this.selectedViewportObject.left || 0;
        const centerY: number = this.selectedViewportObject.top || 0;

        this.canvas.getActiveObjects().forEach((obj) => {
          let index = this.selectedIds.indexOf(obj.name!);
          let newX = obj.left! * Math.cos(rad) - obj.top! * Math.sin(rad);
          let newY = obj.left! * Math.sin(rad) + obj.top! * Math.cos(rad);
          this.selectedObjects[index] = {
            ...this.selectedObjects[index],
            position: {
              x: centerX + newX * scaleX! * flipX,
              y: centerY + newY * scaleY! * flipY,
            },
            rotation: (obj.angle! + degree) % 360,
          } as SceneObject;
          valueRecord.positions.push({
            x: centerX + newX * scaleX! * flipX,
            y: centerY + newY * scaleY! * flipY,
          });
        });
      } else {
        this.selectedObjects[0] = {
          ...this.selectedObjects[0],
          rotation: degree % 360,
        } as SceneObject;
      }

      this.tempModifyValueRecord = valueRecord;
      this.tempModifyTypeRecord = ModificationType.Rotate;

      this.selectedObjectPropertyChanged();
    }
  }

  private objectScalingHandler(option: any) {
    if (this.selectedViewportObject.name === WorldOriginUtil.UUID) {
      return;
    }

    if (this.selectedViewportObject) {
      const id: number = parseInt(this.selectedViewportObject.name!);
      const scaledWidth: number =
        this.selectedViewportObject.getScaledWidth() || 0;
      const scaledHeight: number =
        this.selectedViewportObject.getScaledHeight() || 0;

      const scaleX = this.selectedViewportObject.scaleX;
      const scaleY = this.selectedViewportObject.scaleY;

      let flipX = this.selectedViewportObject.flipX ? -1 : 1;
      let flipY = this.selectedViewportObject.flipY ? -1 : 1;

      if (this.isFirstFrameEditing) {
        this.tempObjectRecord.push(...this.selectedObjects);
        this.isFirstFrameEditing = false;
      }

      let valueRecord: RecordValue.Scale = {
        scaledAttributes: [],
        positions: [],
      };

      if (this.selectedViewportObject.type === 'activeSelection') {
        const centerX: number = this.selectedViewportObject.left || 0;
        const centerY: number = this.selectedViewportObject.top || 0;
        this.canvas.getActiveObjects().forEach((obj) => {
          let index = this.selectedIds.indexOf(obj.name!);
          switch (this.selectedObjects[index]!.objectType) {
            case 'rectangle':
              this.selectedObjects[index] = {
                ...this.selectedObjects[index],
                position: {
                  x: centerX + obj.left! * scaleX! * flipX,
                  y: centerY + obj.top! * scaleY! * flipY,
                },
                dimension: {
                  width: obj.width! * scaleX! + obj.strokeWidth!,
                  height: obj.height! * scaleY! + obj.strokeWidth!,
                },
              } as Rectangle;
              valueRecord.scaledAttributes.push({
                width: obj.width! * scaleX! + obj.strokeWidth!,
                height: obj.height! * scaleY! + obj.strokeWidth!,
              });
              break;

            case 'circle':
              this.selectedObjects[index] = {
                ...this.selectedObjects[index],
                position: {
                  x: centerX + obj.left! * scaleX! * flipX,
                  y: centerY + obj.top! * scaleY! * flipY,
                },
                radius: (obj.width! / 2) * scaleX! + obj.strokeWidth! / 2,
              } as Circle;
              valueRecord.scaledAttributes.push(
                (obj.width! / 2) * scaleX! + obj.strokeWidth! / 2
              );
              break;

            case 'polygon':
              // Update polygon points after scaling
              // Uncomment and adjust the code block for polygons
              this.selectedObjects[index] = {
                ...this.selectedObjects[index],
                position: {
                  x: centerX + obj.left! * scaleX! * flipX,
                  y: centerY + obj.top! * scaleY! * flipY,
                },
                points: (obj as fabric.Polygon).get('points')!.map((point) => ({
                  x:
                    point.x *
                    flipX *
                    this.wasRecordXFlipped *
                    this.wasObjectXFlipped *
                    scaleX! *
                    obj.scaleX!,
                  y:
                    point.y *
                    flipY *
                    this.wasRecordYFlipped *
                    this.wasObjectYFlipped *
                    scaleY! *
                    obj.scaleY!,
                })),
              } as Polygon;
              valueRecord.scaledAttributes.push(
                (obj as fabric.Polygon).get('points')!.map((point) => ({
                  x:
                    point.x *
                    flipX *
                    this.wasRecordXFlipped *
                    this.wasObjectXFlipped *
                    scaleX! *
                    obj.scaleX!,
                  y:
                    point.y *
                    flipY *
                    this.wasRecordYFlipped *
                    this.wasObjectYFlipped *
                    scaleY! *
                    obj.scaleY!,
                }))
              );
              break;

            default:
              break;
          }
          valueRecord.positions.push({
            x: centerX + obj.left! * scaleX! * flipX,
            y: centerY + obj.top! * scaleY! * flipY,
          });
        });
      } else {
        switch (this.selectedObjects[0]!.objectType) {
          case 'rectangle':
            this.selectedObjects[0] = {
              ...this.selectedObjects[0],
              position: {
                x: this.selectedViewportObject.left,
                y: this.selectedViewportObject.top,
              },
              dimension: {
                width: scaledWidth,
                height: scaledHeight,
              },
            } as Rectangle;
            valueRecord.scaledAttributes.push({
              width: scaledWidth,
              height: scaledHeight,
            });
            break;

          case 'circle':
            this.selectedObjects[0] = {
              ...this.selectedObjects[0],
              position: {
                x: this.selectedViewportObject.left,
                y: this.selectedViewportObject.top,
              },
              radius: scaledWidth / 2,
            } as Circle;
            valueRecord.scaledAttributes.push(scaledWidth / 2);
            break;

          case 'polygon':
            // Update polygon points after scaling
            // Uncomment and adjust the code block for polygons
            this.selectedObjects[0] = {
              ...this.selectedObjects[0],
              position: {
                x: this.selectedViewportObject.left,
                y: this.selectedViewportObject.top,
              },
              points: (this.selectedViewportObject as fabric.Polygon)
                .get('points')!
                .map((point) => ({
                  x: point.x * flipX * scaleX!,
                  y: point.y * flipY * scaleY!,
                })),
            } as Polygon;
            valueRecord.scaledAttributes.push(
              (this.selectedViewportObject as fabric.Polygon)
                .get('points')!
                .map((point) => ({
                  x: point.x * flipX * scaleX!,
                  y: point.y * flipY * scaleY!,
                }))
            );
            break;

          default:
            break;
        }
        valueRecord.positions.push({
          x: this.selectedViewportObject.left!,
          y: this.selectedViewportObject.top!,
        });
      }
      this.tempModifyValueRecord = valueRecord;
      this.tempModifyTypeRecord = ModificationType.Scale;

      this.canvas.requestRenderAll();
      this.selectedObjectPropertyChanged();
    }
  }

  private canvasUpdateActiveObject(): void {
    if (this.currentConstructionCursorMode !== ConstructionCursorMode.Select) {
      this.constructionCursorModeSharedService.setCurrentMode(
        ConstructionCursorMode.Select
      );
    }

    this.selectedViewportObject = this.canvas.getActiveObject()!;

    if (this.selectedViewportObject.name === WorldOriginUtil.UUID) {
      return;
    }

    this.selectedViewportObject.adjustPosition('center');

    //Set the originY to center...
    let originalPos = this.selectedViewportObject.getCenterPoint();
    this.selectedViewportObject.originY = 'center';

    this.selectedViewportObject.set({
      top: originalPos.y,
    });
    //...

    const isCircleOrActiveSelection =
      this.selectedViewportObject?.type === 'circle' ||
      this.selectedViewportObject?.type === 'activeSelection';

    this.canvas.uniformScaling = isCircleOrActiveSelection;

    this.selectedViewportObject.setControlsVisibility({
      mt: !isCircleOrActiveSelection,
      mb: !isCircleOrActiveSelection,
      ml: !isCircleOrActiveSelection,
      mr: !isCircleOrActiveSelection,
    });

    this.selectedViewportObject.lockScalingFlip = true;
    this.selectedViewportObject.minScaleLimit = 0.2;

    this.originalRotation = this.selectedViewportObject.angle!;

    this.updateSelectedObject();
    this.selectedObjectPropertiesSharedService.setSelectedObjectId(
      this.selectedIds
    );
    this.selectedObjectPropertiesSharedService.setSelectedObjectsCenterPosition(
      {
        x: this.selectedViewportObject.left!,
        y: this.selectedViewportObject.top!,
      }
    );
  }

  private canvasClearActiveObject(): void {
    this.selectedObjects = [];
    this.selectedIds = [];

    this.selectedObjectPropertiesSharedService.setSelectedObjectId(
      this.selectedIds
    );

    //Check is there some objects didn't get flip properly
    // let viewportObjects = this.canvas.getObjects();
    // for(let object of viewportObjects) {
    //   let matchingObject = this.sceneObjectsSharedService.getSceneObjectById(parseInt(object.name!));
    //   if(matchingObject?.rotation !== ( object.angle! + 360 ) % 360 && this.currentRecordType !== ModificationType.Rotate) {
    //     let isBothFlipped = !object.flipX && !object.flipY;
    //     if(isBothFlipped){
    //       object.set({
    //         //Add 540 to prevent fabric.js somehow make the value negative.
    //         angle: (object.angle! + 540) % 360,
    //         flipX: true,
    //         flipY: true,
    //       });
    //     }else{
    //       object.set({
    //         //Add 540 to prevent fabric.js somehow make the value negative.
    //         angle: (object.angle! + 540) % 360,
    //         flipX: !object.flipX,
    //         flipY: !object.flipY,
    //       });
    //     }
    //   }
    // }
  }

  private updateSelectedObject(): void {
    let newSelectedObjects: SceneObject[] = [];
    let newSelectedIds: string[] = [];

    //Filter out unselected objects
    this.selectedIds.forEach((Id) => {
      if (
        this.canvas
          .getActiveObjects()
          .map((obj) => {
            return obj.name;
          })
          .includes(Id.toString())
      ) {
        newSelectedObjects.push(
          this.sceneObjectsSharedService.getSceneObjectById(Id)!
        );
        newSelectedIds.push(Id);
      }
    });
    //Might have a better way to do it, but I think it's good enough for now
    this.canvas.getActiveObjects().forEach((obj) => {
      if (
        !this.selectedIds
          .map((Id) => {
            return Id;
          })
          .includes(obj.name!)
      ) {
        newSelectedObjects.push(
          this.sceneObjectsSharedService.getSceneObjectById(obj.name!)!
        );
        newSelectedIds.push(obj.name!);
      }
    });

    this.selectedObjects = newSelectedObjects;
    this.selectedIds = newSelectedIds;
  }

  private selectedObjectPropertyChanged(): void {
    for (let index = 0; index < this.selectedIds.length; index++) {
      this.sceneObjectsSharedService.setSceneObjectById(
        this.selectedIds[index],
        this.selectedObjects[index]
      );
    }

    this.selectedObjectPropertiesSharedService.sendPropertyChangedSignal();
  }

  private canvasUpdateActiveObjectVisuals() {
    let isPositionAdjusted = false;
    let isMultiRotated = false;
    this.canvas.getActiveObjects().forEach((obj) => {
      let id = obj.name!;
      let index = this.selectedIds.indexOf(id);
      let newObject = this.sceneObjectsSharedService.getSceneObjectById(id);

      const fillColor = newObject?.hasFill
        ? newObject.fillColor
        : 'transparent';
      const strokeColor = newObject?.borderColor;
      const strokeWidth = newObject?.hasBorder ? newObject.borderThickness : 0;

      if (newObject !== this.selectedObjects[index]) {
        if (
          this.selectedViewportObject.type === 'activeSelection' &&
          !isPositionAdjusted
        ) {
          let offsetX =
            newObject?.position.x! - this.selectedObjects[index].position.x!;
          let offsetY =
            newObject?.position.y! - this.selectedObjects[index].position.y!;
          let offsetRotaion =
            newObject?.rotation! - this.selectedObjects[index].rotation!;

          this.selectedViewportObject.left! += offsetX;
          this.selectedViewportObject.top! += offsetY;

          if (offsetRotaion !== 0) {
            isMultiRotated = true;
            this.selectedViewportObject.angle! += offsetRotaion;
          }

          isPositionAdjusted = true;
        }

        switch (newObject?.objectType) {
          case 'rectangle':
            obj?.set({
              width: (newObject as Rectangle).dimension.width - strokeWidth,
              height: (newObject as Rectangle).dimension.height - strokeWidth,
            });

            break;

          case 'circle':
            (obj as fabric.Circle).set({
              radius: (newObject as Circle).radius - strokeWidth / 2,
            });

            break;

          /* Add polygon support in the future. */
          case 'polygon':
            (obj as fabric.Polygon).set({
              points: (newObject as Polygon).points as Point[],
            });
            break;
        }

        if (isMultiRotated) {
          const degree = fabric.util.degreesToRadians(
            this.selectedViewportObject.angle!
          );
          let centerX = this.selectedViewportObject.left;
          let centerY = this.selectedViewportObject.top;
          let newX = obj.left! * Math.cos(degree) - obj.top! * Math.sin(degree);
          let newY = obj.left! * Math.sin(degree) + obj.top! * Math.cos(degree);
          newObject = {
            ...newObject,
            position: {
              x: centerX! + newX,
              y: centerY! + newY,
            },
          } as SceneObject;
        }

        obj?.set({
          left:
            this.selectedViewportObject.type === 'activeSelection'
              ? obj.left
              : newObject?.position.x,
          top:
            this.selectedViewportObject.type === 'activeSelection'
              ? obj.top
              : newObject?.position.y,
          angle:
            this.selectedViewportObject.type === 'activeSelection'
              ? obj.angle
              : newObject?.rotation,
          scaleX: 1,
          scaleY: 1,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });

        this.selectedObjects[index] = newObject!;

        if (isMultiRotated) {
          this.sceneObjectsSharedService.setSceneObjectById(
            this.selectedIds[index],
            this.selectedObjects[index]
          );
        }
      }
    });
    if (!this.isMouseDown) {
      this.originalRotation = this.canvas.getActiveObject()?.angle!;
    }
    this.canvas.requestRenderAll();
  }

  private updateCanvasPenProperties(penProperties: PenProperties): void {
    if (penProperties.type !== PenType.Eraser) {
      this.canvas.isDrawingMode = true;

      this.canvas.freeDrawingBrush.color =
        penProperties.color +
        HexOpacityConverterService.percentageToHexOpacity(
          penProperties.opacity
        );
      this.canvas.freeDrawingBrush.width = penProperties.thickness;
      this.canvas.freeDrawingBrush.decimate = 2;

      if (
        penProperties.squareLineCap ||
        penProperties.type === PenType.Highlighter
      ) {
        this.canvas.freeDrawingBrush.strokeLineCap = 'square';
      } else {
        this.canvas.freeDrawingBrush.strokeLineCap = 'round';
      }

      if (penProperties.glow || penProperties.type === PenType.LaserPointer) {
        this.canvas.freeDrawingBrush.shadow = new fabric.Shadow({
          color: penProperties.color,
          blur: 9,
        });
      } else {
        (this.canvas.freeDrawingBrush as any).shadow = null;
      }
    } else {
      this.canvas.isDrawingMode = false;
      this.canvas.selection = false;
    }
  }

  private fadeOutAndClearGroup(group: fabric.Group, duration: number) {
    this.isLaserFadeAborted = false;

    group.animate('opacity', 0, {
      duration: duration,
      onChange: () => {
        this.canvas.renderAll();
      },
      onComplete: () => {
        this.removeLaserStrokes();
      },
      abort: () => {
        return this.isLaserFadeAborted;
      },
      easing: fabric.util.ease.easeInExpo,
    } as fabric.IAnimationOptions);
  }

  private abortLaserStrokeFade() {
    // console.log('aborting laser stroke fade');

    this.isLaserFadeAborted = true;
    this.laserStrokeGroup.set('opacity', 1);
    this.canvas.renderAll();
  }

  private removeLaserStrokes() {
    if (this.laserStrokeGroup) {
      this.canvas.remove(...this.laserStrokeGroup.getObjects());
      this.laserStrokeGroup.remove(...this.laserStrokeGroup.getObjects());
      this.canvas.renderAll();
    }
  }

  // private eraseStroke2(path: fabric.Path) {
  //   if (this.penProperties.type === PenType.Eraser && this.isMouseDown) {
  //     this.canvas.remove(path);
  //     this.normalStrokeGroup.remove(path);
  //     this.canvas.requestRenderAll();
  //   }
  // }

  private eraseStroke(event: MouseEvent) {
    const pointer = this.canvas.getPointer(event, true);
    const strokes = this.normalStrokeGroup.getObjects();

    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i];
      if (this.canvas.isTargetTransparent(stroke, pointer.x, pointer.y)) {
        continue;
      }

      this.canvas.remove(stroke);
      this.normalStrokeGroup.remove(stroke);
      this.canvas.requestRenderAll();

      break;
    }
  }

  private zoomToFitSelection() {
    let zoom = this.canvas.getZoom();

    let canvasHalfWidth = this.canvas.width! / 2;
    let canvasHalfHeight = this.canvas.height! / 2;

    let objectHalfWidth = this.selectedViewportObject.width! / 2;
    let objectHalfHeight = this.selectedViewportObject.height! / 2;

    while (
      (objectHalfWidth * zoom > canvasHalfWidth ||
        objectHalfHeight * zoom > canvasHalfHeight) &&
      zoom < this.maximumZoom &&
      zoom > this.minimumZoom
    ) {
      this.viewportTransformSharedService.sendAdjustZoomPercentageSignal(-0.1);
      zoom = this.canvas.getZoom();
    }
  }

  private viewportRecordProcessor(recordData: {
    ids: string[];
    type: ModificationType;
  }) {
    this.currentRecordType = recordData.type;
    this.canvas.discardActiveObject();
    let recordedObjects = this.canvas.getObjects().filter((obj) => {
      return recordData.ids.includes(obj.name!);
    });
    switch (recordData.type) {
      case ModificationType.Move:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].top = matchingObject?.position.y;
          recordedObjects[index].left = matchingObject?.position.x;
        }
        break;
      case ModificationType.Rotate:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].angle = matchingObject?.rotation;
          recordedObjects[index].top = matchingObject?.position.y;
          recordedObjects[index].left = matchingObject?.position.x;
        }
        break;
      case ModificationType.Scale:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );

          switch (matchingObject?.objectType) {
            case 'rectangle':
              recordedObjects[index].set({
                width:
                  (matchingObject as Rectangle).dimension.width -
                  matchingObject.borderThickness,
                height:
                  (matchingObject as Rectangle).dimension.height -
                  matchingObject.borderThickness,
              });

              break;

            case 'circle':
              (recordedObjects[index] as fabric.Circle).set({
                radius:
                  (matchingObject as Circle).radius -
                  matchingObject.borderThickness / 2,
                width:
                  (matchingObject as Circle).radius * 2 -
                  matchingObject.borderThickness,
                height:
                  (matchingObject as Circle).radius * 2 -
                  matchingObject.borderThickness,
              });

              break;

            case 'polygon':
              //Viewport polygon's points doesn't support negative, so we scale the polygon instead.
              let newPoints: fabric.Point[] = [];

              (matchingObject as Polygon).points.forEach((point) => {
                newPoints.push(new fabric.Point(point.x, point.y));
              });

              let newMaxX = Math.max(
                ...newPoints
                  .map((point) => point.x)
                  .filter((x) => {
                    return x !== 0;
                  })
              );
              let newMaxY = Math.max(
                ...newPoints
                  .map((point) => point.y)
                  .filter((x) => {
                    return x !== 0;
                  })
              );

              let oldMaxX = Math.max(
                ...(recordedObjects[index] as fabric.Polygon).points!.map(
                  (point) => point.x
                )
              );
              let oldMaxY = Math.max(
                ...(recordedObjects[index] as fabric.Polygon).points!.map(
                  (point) => point.y
                )
              );

              let isXFlip = newMaxX < 0;

              let isYFlip = newMaxY < 0;

              if (isXFlip) {
                newMaxX = Math.min(...newPoints.map((point) => point.x));
                this.wasRecordXFlipped = -1;
              }
              if (isYFlip) {
                newMaxY = Math.min(...newPoints.map((point) => point.y));
                this.wasRecordYFlipped = -1;
              }

              let newScaleX = Math.abs(newMaxX) / oldMaxX;

              let newScaleY = Math.abs(newMaxY) / oldMaxY;

              (recordedObjects[index] as fabric.Polygon).set({
                scaleX: newScaleX,
                scaleY: newScaleY,
                flipX: isXFlip,
                flipY: isYFlip,
              });

              break;

            default:
              break;
          }

          recordedObjects[index].top = matchingObject?.position.y;
          recordedObjects[index].left = matchingObject?.position.x;

          if (matchingObject?.objectType !== ObjectType.Polygon) {
            //Polygon work differently
            //Do this because SceneObject's data doesn't have scale, but on the viewport sides, it has 'scale' value, insteads of 'scale' the value
            recordedObjects[index].set({
              scaleX: 1,
              scaleY: 1,
            });
            //...
          }
        }
        break;
      case ModificationType.SetPositionX:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].left = matchingObject?.position.x;
        }
        break;
      case ModificationType.SetPositionY:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].top = matchingObject?.position.y;
        }
        break;
      case ModificationType.SetDimensionWidth:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].set({
            width:
              (matchingObject as Rectangle).dimension.width -
              matchingObject?.borderThickness!,
          });
        }
        break;
      case ModificationType.SetDimensionHeight:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].set({
            height:
              (matchingObject as Rectangle).dimension.height -
              matchingObject?.borderThickness!,
          });
        }
        break;
      case ModificationType.SetRadius:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          (recordedObjects[index] as fabric.Circle).set({
            radius:
              (matchingObject as Circle).radius -
              matchingObject?.borderThickness! / 2,
          });
        }
        break;
      case ModificationType.SetRotation:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].angle = matchingObject?.rotation;
          recordedObjects[index].top = matchingObject?.position.y;
          recordedObjects[index].left = matchingObject?.position.x;
        }
        break;
      case ModificationType.SetFillColor:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].set({
            fill: matchingObject?.fillColor,
          });
        }
        break;
      case ModificationType.SetBorderColor:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          recordedObjects[index].set({
            stroke: matchingObject?.borderColor,
          }) as fabric.Object;
        }
        break;
      case ModificationType.SetBorderThickness:
        for (let index = 0; index < recordedObjects.length; index++) {
          let matchingObject =
            this.sceneObjectsSharedService.getSceneObjectById(
              recordData.ids[index]
            );
          let thicknessOffset =
            recordedObjects[index].strokeWidth! -
            matchingObject?.borderThickness!;
          recordedObjects[index].set({
            width: recordedObjects[index].width! + thicknessOffset,
            height: recordedObjects[index].height! + thicknessOffset,
            ...((recordedObjects[index] as fabric.Circle).radius! && {
              radius:
                (recordedObjects[index] as fabric.Circle).radius! +
                thicknessOffset / 2,
            }),
            strokeWidth: matchingObject?.borderThickness,
          }) as fabric.Object;
        }
        break;
      default:
        break;
    }

    if (recordedObjects.length > 1) {
      let selection = new fabric.ActiveSelection(recordedObjects, {
        originX: 'center',
        originY: 'center',
        canvas: this.canvas,
      });
      this.canvas.setActiveObject(selection);
    } else {
      this.canvas.setActiveObject(recordedObjects[0]);
    }

    this.canvas.requestRenderAll();
  }
}
