import { Injectable } from '@angular/core';

import { fabric } from 'fabric';
import * as Matter from 'matter-js';

import {
  ObjectType,
  Rectangle,
  Circle,
  Polygon,
} from 'src/app/model/scene.model';

import { SceneObjectsSharedService } from 'src/app/services/scene-objects-shared.service';
import { RotationConverterService } from 'src/app/services/rotation-converter.service';

@Injectable({
  providedIn: 'root',
})
export class MatterJSPhysicsService {
  private canvas!: fabric.Canvas;

  private engine = Matter.Engine.create();
  private runner = Matter.Runner.create();
  private physicsObjects: Matter.Body[] = [];

  constructor(
    private sceneObjectSharedService: SceneObjectsSharedService,
    private rotationConverterService: RotationConverterService,
  ) {}

  private calculateBoundingBoxCenter(points: { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...points.map((point) => point.x));
    const maxY = Math.max(...points.map((point) => point.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { x: centerX, y: centerY };
  }

  public initialize(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  public setupPhysics(): void {
    this.sceneObjectSharedService.getSceneObjectIds().forEach((id) => {
      let element = this.sceneObjectSharedService.getSceneObjectById(id);
      let physicsObject!: Matter.Body;

      switch (element!.objectType) {
        case ObjectType.Rectangle:
          let rectangle = element as Rectangle;

          physicsObject = Matter.Bodies.rectangle(
            rectangle.position.x,
            rectangle.position.y,
            rectangle.dimension.width,
            rectangle.dimension.height,
            {
              angle: this.rotationConverterService.degreesToRadians(
                rectangle.rotation,
              ),
            },
          );

          break;

        case ObjectType.Circle:
          let circle = element as Circle;

          physicsObject = Matter.Bodies.circle(
            circle.position.x,
            circle.position.y,
            circle.radius,
            {
              angle: this.rotationConverterService.degreesToRadians(
                circle.rotation,
              ),
            },
          );
          break;

        case ObjectType.Polygon:
          let polygon = element as Polygon;

          const rad = fabric.util.degreesToRadians(polygon.rotation);

          let shapeCenter = this.calculateBoundingBoxCenter(polygon.points);
          let centerOfMass = Matter.Vertices.centre(polygon.points);

          // Calculate the offset to align the center of mass with the bounding box center.
          let offsetX = centerOfMass.x - shapeCenter.x;
          let offsetY = centerOfMass.y - shapeCenter.y;

          // Create the Matter.js body with the adjusted position
          physicsObject = Matter.Bodies.fromVertices(
            polygon.position.x +
              offsetX * Math.cos(rad) -
              offsetY * Math.sin(rad),
            polygon.position.y +
              offsetX * Math.sin(rad) +
              offsetY * Math.cos(rad),
            [polygon.points],
            { angle: rad },
          );
          break;

        default:
          break;
      }

      physicsObject.id = id;
      physicsObject.isStatic = element!.isStatic;
      physicsObject.mass = element!.mass;
      physicsObject.frictionStatic = element!.friction.static;
      physicsObject.friction = element!.friction.kinetic;

      Matter.Body.setVelocity(physicsObject, {
        x: element!.linearVelocity.x,
        y: element!.linearVelocity.y,
      });

      this.physicsObjects.push(physicsObject);
    });

    Matter.World.add(this.engine.world, this.physicsObjects);
  }

  public resetPhysics(): void {
    Matter.World.remove(this.engine.world, this.physicsObjects); // Remove all physics objects fron the world.
    this.physicsObjects = []; // Clear the physics object list.

    this.setupPhysics();
  }

  public stepForward(): void {
    let canvasObjects = this.canvas.getObjects();

    Matter.Runner.tick(this.runner, this.engine, 8 / 60);

    // Iterate through Matter.js bodies and render them using Fabric.js
    Matter.Composite.allBodies(this.engine.world).forEach((body) => {
      let currentObject = canvasObjects.find(
        (obj) => obj.name === body.id.toString(),
      );

      if (currentObject?.type === 'rect' || currentObject?.type === 'circle') {
        currentObject.set({
          left: body.position.x,
          top: body.position.y,
          angle: this.rotationConverterService.radiansToDegrees(body.angle),
        });
      } else {
        let points = (
          this.sceneObjectSharedService.getSceneObjectById(body.id) as Polygon
        ).points;

        let shapeCenter = this.calculateBoundingBoxCenter(points);
        let centerOfMass = Matter.Vertices.centre(points);

        // Calculate the offset to align the center of mass with the bounding box center.
        let offsetX = centerOfMass.x - shapeCenter.x;
        let offsetY = centerOfMass.y - shapeCenter.y;

        let rad = body.angle;

        currentObject!.set({
          left:
            body.position.x -
            (offsetX * Math.cos(rad) - offsetY * Math.sin(rad)),
          top:
            body.position.y -
            (offsetX * Math.sin(rad) + offsetY * Math.cos(rad)),
          angle: this.rotationConverterService.radiansToDegrees(rad),
        });
      }

      currentObject?.setCoords(); // Update canvas object location.
    });

    this.canvas.requestRenderAll();
  }
}
