import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import {
  b2Body,
  b2Vec2,
  b2BodyDef,
  b2PolygonShape,
  b2World,
  b2BodyType,
} from '@box2d/core';

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
export class Box2DPhysicsService {
  private canvas!: fabric.Canvas;
  private world!: b2World;
  private physicsObjects: b2Body[] = [];

  constructor(
    private sceneObjectSharedService: SceneObjectsSharedService,
    private rotationConverterService: RotationConverterService,
  ) {}

  private createRectanglePhysics(rectangle: Rectangle): b2Body {
    const shape = new b2PolygonShape();
    shape.SetAsBox(rectangle.dimension.width / 2, rectangle.dimension.height);

    const body = this.world.CreateBody({
      type: rectangle.isStatic
        ? b2BodyType.b2_staticBody
        : b2BodyType.b2_dynamicBody,
      position: new b2Vec2(rectangle.position.x, rectangle.position.y),
      angle: this.rotationConverterService.degreesToRadians(rectangle.rotation),
    });

    body.CreateFixture({
      shape,
      density: 1,
      friction: rectangle.friction.kinetic,
    });

    return body;
  }

  private createCirclePhysics(circle: Circle): b2Body {
    const shape = new b2PolygonShape();
    shape.SetAsBox(circle.radius, circle.radius);

    const body = this.world.CreateBody({
      type: circle.isStatic
        ? b2BodyType.b2_staticBody
        : b2BodyType.b2_dynamicBody,
      position: new b2Vec2(circle.position.x, circle.position.y),
      angle: this.rotationConverterService.degreesToRadians(circle.rotation),
    });

    body.CreateFixture({
      shape,
      density: 1,
      friction: circle.friction.kinetic,
    });

    return body;
  }

  private createPolygonPhysics(polygon: Polygon): b2Body {
    return this.world.CreateBody({});
  }

  public initialize(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  public setupPhysics(): void {
    this.world = b2World.Create(new b2Vec2(0, 9.8));

    this.sceneObjectSharedService.getSceneObjectIds().forEach((id) => {
      const element = this.sceneObjectSharedService.getSceneObjectById(id);
      if (!element) {
        console.error(`No element with id ${id} found`);
        return;
      }

      let physicsObject: b2Body;

      switch (element.objectType) {
        case ObjectType.Rectangle:
          physicsObject = this.createRectanglePhysics(element as Rectangle);
          break;
        case ObjectType.Circle:
          physicsObject = this.createCirclePhysics(element as Circle);
          break;
        case ObjectType.Polygon:
          physicsObject = this.createPolygonPhysics(element as Polygon);
          break;
        default:
          return;
      }

      physicsObject.SetUserData(id.toString());
      physicsObject.SetMassData({
        mass: element.mass,
        center: new b2Vec2(0, 0),
        I: 1,
      });

      this.physicsObjects.push(physicsObject);
    });
  }

  public resetPhysics(): void {
    this.physicsObjects = [];
    this.setupPhysics();
  }

  public stepForward(): void {
    this.world.Step(0.2, {
      velocityIterations: 6,
      positionIterations: 2,
    });

    const canvasObjects = this.canvas.getObjects();

    this.physicsObjects.forEach((body) => {
      let currentObject = canvasObjects.find(
        (obj) => obj.name === body.GetUserData().toString(),
      );

      if (!currentObject) {
        console.error(`No object with name ${body.GetUserData()} found`);
        return;
      }

      currentObject.set({
        left: body.GetPosition().x,
        top: body.GetPosition().y,
        angle: this.rotationConverterService.radiansToDegrees(body.GetAngle()),
      });
    });

    this.canvas.requestRenderAll();
  }
}
