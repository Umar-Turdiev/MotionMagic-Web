import { Injectable } from '@angular/core';
import { Subject, takeUntil, first } from 'rxjs';

import { fabric } from 'fabric';

import { SceneObject, Vector2D } from 'src/app/model/scene.model';
import { SceneObjectsSharedService } from 'src/app/services/scene-objects-shared.service';
import { SceneObjectCreationService } from './scene-object-creation.service';
import { WorldOrigin } from './world-origin.util';
import { WorldOriginSharedService } from 'src/app/services/world-origin.shared.service';

import { RapierPhysicsService } from 'src/app/services/physics/rapier-physics.service';
import { SimulationControlSharedService } from 'src/app/services/simulation-control-shared.service';

@Injectable({
  providedIn: 'root',
})
export class ViewportRendererService {
  private unsubscribe = new Subject<void>();

  private canvas!: fabric.Canvas;
  private worldOrigin: Vector2D = { x: 0, y: 0 };
  private worldOriginMarker = new WorldOrigin();

  private isRunning: boolean = false;

  constructor(
    private sceneObjectSharedService: SceneObjectsSharedService,
    private sceneObjectCreationService: SceneObjectCreationService,
    private physicsService: RapierPhysicsService,
    private simulationControlSharedService: SimulationControlSharedService,
    private worldOriginSharedService: WorldOriginSharedService
  ) {}

  public initialize(canvas: fabric.Canvas) {
    this.canvas = canvas;

    this.sceneObjectSharedServiceSetup();
    this.simulationControlSharedServiceSetup();
    this.worldOriginSharedServiceSetup();

    this.physicsService.initialize(this.canvas);

    this.renderLoop();
  }

  private sceneObjectSharedServiceSetup(): void {
    // This only runs once in the setup phase.
    this.sceneObjectSharedService
      .getSceneObjects$()
      .pipe(takeUntil(this.unsubscribe), first())
      .subscribe((data) => {
        this.graphicsSetup(true);
      });

    this.sceneObjectSharedService
      .getNewObjectAddedSignal$()
      .subscribe((data: { id: string; sceneObject: SceneObject }) => {
        let object = this.sceneObjectCreationService.createViewportObject(
          data.id,
          data.sceneObject,
          'center',
          'center',
          true
        );

        this.addToViewport(object);
      });
  }

  private simulationControlSharedServiceSetup(): void {
    this.simulationControlSharedService
      .getIsRunning$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (this.isRunning !== data) {
          this.isRunning = data;
          console.log('running: ' + this.isRunning);
        }
      });

    this.simulationControlSharedService.getRestartSignal$().subscribe(() => {
      this.resetScene();
    });
  }

  private worldOriginSharedServiceSetup(): void {
    this.worldOriginSharedService
      .getWorldOrigin$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data: Vector2D) => {
        if (data === this.worldOrigin) {
          return;
        }

        this.worldOrigin = data;
        this.worldOriginMarker.left = data.x;
        this.worldOriginMarker.top = data.y;
        this.canvas.requestRenderAll();
      });
  }

  /**
   * Add an object to the viewport
   * @param object - The object to add
   */
  private addToViewport(object: fabric.Object): void {
    this.canvas.add(object);
  }

  public startSimulation(): void {
    this.isRunning = true;
  }

  public stopSimulation(): void {
    this.isRunning = false;
  }

  public resetSimulation(): void {
    this.physicsService.resetPhysics();
  }

  public graphicsSetup(allowControl: boolean = false): void {
    this.worldOriginMarker.set({
      left: this.worldOrigin.x - 30 * this.worldOriginMarker.scaleX!,
      top: this.worldOrigin.y + 30 * this.worldOriginMarker.scaleY!,
    });

    this.addToViewport(this.worldOriginMarker);
    // this.canvas.moveTo(this.worldOriginMarker, 9999999);

    this.sceneObjectSharedService.getSceneObjectIds().forEach((id) => {
      let element = this.sceneObjectSharedService.getSceneObjectById(id);
      let object = this.sceneObjectCreationService.createViewportObject(
        id.toString(),
        element!,
        'center',
        'center',
        allowControl
      );

      this.addToViewport(object);
    });
  }

  public resetGraphics(): void {
    this.canvas.getObjects().forEach((object) => {
      if (!(object instanceof fabric.Group)) {
        this.canvas.remove(object); // Remove non-group objects
      }
    });

    this.canvas.renderAll();

    this.graphicsSetup();
  }

  private resetScene(): void {
    this.isRunning = false; // Stop the simulation.

    this.resetGraphics();
    this.physicsService.resetPhysics();
  }

  private renderLoop() {
    if (this.isRunning) {
      this.physicsService.stepForward();
    }

    fabric.util.requestAnimFrame(() => {
      this.renderLoop();
    });
  }
}
