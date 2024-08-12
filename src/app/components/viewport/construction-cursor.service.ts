import { Injectable } from '@angular/core';

import { fabric } from 'fabric';

import { Pair } from 'src/app/model/pair';
import {
  SceneObject,
  ObjectType,
  Rectangle,
  Circle,
  Joint,
  LengthUnit,
  AngleUnit,
  MassUnit,
  LinearVelocityUnit,
} from 'src/app/model/scene.model';
import { ConstructionCursorMode } from 'src/app/model/construction-cursor-mode.model';
import { GraphicalObjectFactory } from './graphical-object/graphical-object-factory';

@Injectable({
  providedIn: 'root',
})
export class ConstructionCursorService {
  private canvas!: fabric.Canvas;

  public isCreating = false;
  private initialMouseDownPos: { x: number; y: number } = { x: 0, y: 0 };
  private isFirstFrameMoving = true;
  private createdViewportObject: fabric.Object | null = null;
  private currentConstructionCursorMode: ConstructionCursorMode | null = null;

  private lastUsedColorIds: number[] = [];
  private defaultColors: Pair<string, string>[] = [
    new Pair('#368bffff', '#1a79ffff'),
    new Pair('#ffe972ff', '#fad81bff'),
    new Pair('#f46059ff', '#f43a32ff'),
    new Pair('#368bbbff', '#2878a6ff'),
    new Pair('#ccccffff', '#a6a6f7ff'),
    new Pair('#99ff99ff', '#7bdd7cff'),
    new Pair('#80d7ffff', '#59c7f8ff'),
    new Pair('#ff9c48ff', '#f2852aff'),
    new Pair('#66ccccff', '#51acadff'),
    new Pair('#904fe5ff', '#7c36d9ff'),
    new Pair('#ff99ccff', '#e076aeff'),
  ];
  private defaultBorderWidth: number = 5;

  constructor(private graphicalObjectFactory: GraphicalObjectFactory) {}

  private cleanUp() {
    // Remove the temporary created obejct.
    this.canvas.remove(this.createdViewportObject!);

    // Clean up / reset.
    this.initialMouseDownPos = { x: 0, y: 0 };
    this.isCreating = false;
    this.isFirstFrameMoving = true;
    this.canvas.selection = true;
    this.currentConstructionCursorMode = null;
    this.createdViewportObject = null;
  }

  private getCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
    const pointer = this.canvas.getPointer(event);

    return { x: pointer.x, y: pointer.y };
  }

  private randomColorId() {
    const min = 0;
    const max = this.defaultColors.length - 1;

    let newColorPairId = 0;

    while (this.lastUsedColorIds.includes(newColorPairId)) {
      newColorPairId = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    this.lastUsedColorIds.push(newColorPairId);

    if (this.lastUsedColorIds.length === this.defaultColors.length) {
      this.lastUsedColorIds = [];
    }

    return newColorPairId;
  }

  public initialize(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  public beginConstruction(event: MouseEvent, mode: ConstructionCursorMode) {
    if (!this.canvas) {
      console.error('Canvas was not initialized! (Canvas is null.)');
      return;
    }

    this.isCreating = true;
    this.isFirstFrameMoving = true;

    this.currentConstructionCursorMode = mode;
    this.initialMouseDownPos = this.getCanvasCoordinates(event);
    this.canvas.selection = false;

    if (
      this.currentConstructionCursorMode === ConstructionCursorMode.DrawJoint
    ) {
      this.createdViewportObject = this.graphicalObjectFactory.createCircle(10);

      this.graphicalObjectFactory.setCommonProperties(
        this.createdViewportObject,
        '',
        this.initialMouseDownPos.x,
        this.initialMouseDownPos.y,
        'center',
        'center',
        0,
        '#ffffffff',
        '#bebebeff',
        this.defaultBorderWidth,
        true,
        false
      );

      this.isFirstFrameMoving = false;
    }
  }

  public constructObject(event: MouseEvent) {
    if (!this.canvas) {
      console.error(
        'Canvas was not initialized! (Canvas is null.)',
        'canvas: '
      );
      return;
    }

    if (this.isFirstFrameMoving) {
      switch (this.currentConstructionCursorMode) {
        case ConstructionCursorMode.DrawRectangle:
          this.createdViewportObject =
            this.graphicalObjectFactory.createRectangle(0, 0);
          break;

        case ConstructionCursorMode.DrawCircle:
          this.createdViewportObject =
            this.graphicalObjectFactory.createCircle(0);
          break;

        default:
          console.error(
            'Viewport object was not created! (Check current construction cursor mode.)',
            'currentConstructionCursorMode: ',
            this.currentConstructionCursorMode
          );
          return;
      }

      const colorPairId: number = this.randomColorId();

      this.graphicalObjectFactory.setCommonProperties(
        this.createdViewportObject,
        '',
        this.initialMouseDownPos.x,
        this.initialMouseDownPos.y,
        'center',
        'center',
        0,
        this.defaultColors[colorPairId].first,
        this.defaultColors[colorPairId].second,
        this.defaultBorderWidth,
        true,
        true
      );

      if (
        this.currentConstructionCursorMode ===
        ConstructionCursorMode.DrawRectangle
      ) {
        this.createdViewportObject.set({
          originX: 'left',
          originY: 'top',
        });
      }

      this.isFirstFrameMoving = false;
      this.canvas.add(this.createdViewportObject);
    } else {
      let { x, y } = this.getCanvasCoordinates(event);
      const deltaX = x - this.initialMouseDownPos.x;
      const deltaY = y - this.initialMouseDownPos.y;

      // Update the created rectangle's dimensions
      if (this.createdViewportObject) {
        switch (this.currentConstructionCursorMode) {
          case ConstructionCursorMode.DrawRectangle:
            this.createdViewportObject.set({
              width: Math.abs(deltaX),
              height: Math.abs(deltaY),
            });

            // The set() function for setting the scaleX and scaleY is not working properly.
            this.createdViewportObject.scaleX = deltaX < 0 ? -1 : 1;
            this.createdViewportObject.scaleY = deltaY < 0 ? -1 : 1;
            break;

          case ConstructionCursorMode.DrawCircle:
            (this.createdViewportObject as fabric.Circle).set({
              radius:
                Math.sqrt(deltaX ** 2 + deltaY ** 2) +
                this.defaultBorderWidth / 2,
            });
            break;
        }

        this.canvas.requestRenderAll();
      }
    }
  }

  public endConstruction(): SceneObject | null {
    if (!this.canvas) {
      console.error(
        'Canvas was not initialized! (Canvas is null.)',
        'canvas: '
      );
      return null;
    }

    if (this.isFirstFrameMoving) {
      this.cleanUp();

      return null;
    }

    let newSceneObject: SceneObject;

    if (!this.createdViewportObject) {
      console.error(
        'Viewport object was not created! (Created viewport object is null.)',
        'createdViewportObject: ',
        this.createdViewportObject
      );
      return null;
    }

    switch (this.currentConstructionCursorMode) {
      case ConstructionCursorMode.DrawRectangle:
        newSceneObject = {
          position: {
            x:
              this.createdViewportObject.left! +
              (this.createdViewportObject.scaleX! *
                this.createdViewportObject.width!) /
                2 +
              this.defaultBorderWidth / 2,
            y:
              this.createdViewportObject.top! +
              (this.createdViewportObject.scaleY! *
                this.createdViewportObject.height!) /
                2 +
              this.defaultBorderWidth / 2,
          },
          dimension: {
            width: this.createdViewportObject.width! + this.defaultBorderWidth,
            height:
              this.createdViewportObject.height! + this.defaultBorderWidth,
          },
          objectType: ObjectType.Rectangle,
        } as Rectangle;
        break;

      case ConstructionCursorMode.DrawCircle:
        newSceneObject = {
          position: {
            x: this.createdViewportObject.left!,
            y: this.createdViewportObject.top!,
          },
          radius:
            this.createdViewportObject.width! / 2 + this.defaultBorderWidth / 2,
          objectType: ObjectType.Circle,
        } as Circle;
        break;

      // case ConstructionCursorMode.DrawRamp:
      // case ConstructionCursorMode.DrawPolygon:
      // case ConstructionCursorMode.DrawRope:
      // case ConstructionCursorMode.DrawSpring:
      case ConstructionCursorMode.DrawJoint:
        newSceneObject = {
          position: {
            x: this.createdViewportObject.left!,
            y: this.createdViewportObject.top!,
          },
          radius: 10,
          objectType: ObjectType.Joint,
          fixed: false,
          hasMotor: false,
          motor: {
            targetVelocity: 0,
            targetPosition: 0,
            damping: 0,
            stiffness: 0,
          },
        } as Joint;
        break;
      // case ConstructionCursorMode.DrawSensor:

      default:
        console.error(
          'Viewport object was not created! Please check the current construction cursor mode!',
          'createdViewportObject: ',
          this.createdViewportObject
        );
        return null;
    }

    switch (newSceneObject.objectType) {
      case ObjectType.Rectangle:
      case ObjectType.Circle:
      case ObjectType.Ramp:
      case ObjectType.Polygon:
      case ObjectType.Sensor:
        newSceneObject = {
          ...newSceneObject,

          isStatic: false,
          mass: 10,
          friction: { static: 0.5, kinetic: 0.2 },
          linearVelocity: { x: 0, y: 0 },
          lengthUnit: LengthUnit.Meter,
          angleUnit: AngleUnit.Radian,
          massUnit: MassUnit.Kilogram,
          linearVelocityUnit: LinearVelocityUnit.MeterPerSecond,
        };
        break;

      case ObjectType.Rope:
      case ObjectType.Spring:
      case ObjectType.Joint:
        newSceneObject = {
          ...newSceneObject,

          objectA: '-1',
          offsetA: { x: 0, y: 0 },
          objectB: '-1',
          offsetB: { x: 0, y: 0 },
        };
        break;

      default:
        break;
    }

    newSceneObject = {
      ...newSceneObject,

      name: 'Unnamed',
      rotation: 0,

      hasFill: true,
      fillColor: this.createdViewportObject.fill?.toString() || '#ffffff',
      hasBorder: true,
      borderColor: this.createdViewportObject.stroke?.toString() || '#ffffff',
      borderThickness: this.defaultBorderWidth,
    };

    this.cleanUp();

    return newSceneObject;
  }
}
