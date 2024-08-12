import { Injectable } from '@angular/core';

import { fabric } from 'fabric';
import RAPIER, { Vector2 } from '@dimforge/rapier2d';

import {
  SceneObject,
  isDynamicObject,
  DynamicObject,
  Constraint,
  ObjectType,
  Rectangle,
  Circle,
  Ramp,
  Polygon,
  Sensor,
  Rope,
  Spring,
  Joint,
} from 'src/app/model/scene.model';

import { SceneObjectsSharedService } from 'src/app/services/scene-objects-shared.service';
import { RotationConverterService } from 'src/app/services/rotation-converter.service';

@Injectable({
  providedIn: 'root',
})
export class RapierPhysicsService {
  private canvas!: fabric.Canvas;

  private rapierWorld!: RAPIER.World;
  private rapierObjects: Map<
    string,
    {
      rigidBodyDesc: RAPIER.RigidBodyDesc;
      rigidBody: RAPIER.RigidBody;
      colliderDesc: RAPIER.ColliderDesc;
      collider: RAPIER.Collider;
    }
  > = new Map();

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

  /**
   * Return the offsets to offset the shape from its center of mass to its bounding box center.
   *
   * @param points - An array of polygon points.
   * @param centerOfMass - The center of mass of the body.
   */
  private calculateShapeOffset(
    points: { x: number; y: number }[],
    centerOfMass: { x: number; y: number },
  ): { x: number; y: number } {
    const shapeCenter = this.calculateBoundingBoxCenter(points);

    return {
      x: centerOfMass.x - shapeCenter.x,
      y: centerOfMass.y - shapeCenter.y,
    };
  }

  private createRectangleCollider(rectangle: Rectangle): RAPIER.ColliderDesc {
    return RAPIER.ColliderDesc.cuboid(
      rectangle.dimension.width / 2,
      rectangle.dimension.height / 2,
    );
  }

  private createCircleCollider(circle: Circle): RAPIER.ColliderDesc {
    return RAPIER.ColliderDesc.ball(circle.radius);
  }

  private createPolygonCollider(polygon: Polygon): RAPIER.ColliderDesc {
    const pointsArray: Float32Array = new Float32Array(
      polygon.points.length * 2,
    );
    for (let i = 0; i < polygon.points.length; i++) {
      pointsArray[i * 2] = polygon.points[i].x;
      pointsArray[i * 2 + 1] = polygon.points[i].y;
    }

    return RAPIER.ColliderDesc.convexHull(pointsArray) as RAPIER.ColliderDesc;
  }

  private dynamicObjectSetup(element: DynamicObject, id: string) {
    let colliderDesc: RAPIER.ColliderDesc;

    switch (element.objectType) {
      case ObjectType.Rectangle:
        colliderDesc = this.createRectangleCollider(element as Rectangle);
        break;
      case ObjectType.Circle:
        colliderDesc = this.createCircleCollider(element as Circle);
        break;
      case ObjectType.Polygon:
        colliderDesc = this.createPolygonCollider(element as Polygon);
        break;
      default:
        console.log('Unknown object type: ' + element!.objectType);
        return;
    }

    let rigidBodyDesc = element.isStatic
      ? RAPIER.RigidBodyDesc.fixed()
      : RAPIER.RigidBodyDesc.dynamic();

    if (element.objectType === ObjectType.Polygon) {
      const offset = this.calculateShapeOffset(
        (element as Polygon).points,
        colliderDesc.centerOfMass,
      );
      const rad = this.rotationConverterService.degreesToRadians(
        element.rotation,
      );

      rigidBodyDesc.setTranslation(
        element.position.x +
          offset.x * Math.cos(rad) -
          offset.y * Math.sin(rad),
        element.position.y +
          offset.x * Math.sin(rad) +
          offset.y * Math.cos(rad),
      );
    } else {
      rigidBodyDesc.setTranslation(element.position.x, element.position.y);
    }
    rigidBodyDesc.setRotation(
      this.rotationConverterService.degreesToRadians(element.rotation),
    );
    rigidBodyDesc.setLinvel(element.linearVelocity.x, element.linearVelocity.y);
    // rigidBodyDesc.setAngvel(element.angularVelocity); // We don't support this yet.

    if (
      Math.sqrt(element.linearVelocity.x ** 2 + element.linearVelocity.y ** 2) >
      500
    ) {
      rigidBodyDesc.setCcdEnabled(true);
    }

    let RigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

    let collider = this.rapierWorld.createCollider(colliderDesc, RigidBody);
    collider.setFriction(element.friction.kinetic);
    collider.setMass(element.mass);

    this.rapierObjects.set(id.toString(), {
      rigidBodyDesc,
      rigidBody: RigidBody,
      colliderDesc,
      collider,
    });
  }

  private createRopeParams(element: Rope) {
    // the offset does nothing for now
    return RAPIER.JointData.rope(
      element.length,
      element.offsetA,
      element.offsetB,
    );
  }

  private createSpringParams(element: Spring) {
    // the offset does nothing for now
    return RAPIER.JointData.spring(
      element.length,
      element.stiffness,
      element.damping,
      element.offsetA,
      element.offsetB,
    );
  }

  /**
   * Creates a fixed joint between two bodies.
   *
   * @param element - The joint to create.
   * @param rotation - The rotation of the joint in radians.
   */
  private createFixedJointParams(element: Joint, rotation: number) {
    // the offset does nothing for now
    return RAPIER.JointData.fixed(
      element.offsetA,
      rotation,
      element.offsetB,
      rotation,
    );
  }

  private creatRevoluteeJointParams(element: Joint) {
    return RAPIER.JointData.revolute(element.offsetA, element.offsetB);
  }

  private constraintSetup(element: Constraint, id: string) {
    console.log(element);

    let constraintParams: RAPIER.JointData;

    switch (element.objectType) {
      case ObjectType.Rope:
        constraintParams = this.createRopeParams(element as Rope);
        break;
      case ObjectType.Spring:
        constraintParams = this.createSpringParams(element as Spring);
        break;
      case ObjectType.Joint:
        if ((element as Joint).fixed === true) {
          let rotation = this.rotationConverterService.degreesToRadians(
            this.sceneObjectSharedService.getSceneObjectById(
              element.objectA,
            )?.rotation!,
          );

          if (!rotation) {
            console.log(
              'No rotation for fixed joint, id: ' + id + ', element: ',
              element,
            );

            rotation = 0;
          }

          constraintParams = this.createFixedJointParams(
            element as Joint,
            this.rotationConverterService.degreesToRadians(rotation),
          );
        } else {
          constraintParams = this.creatRevoluteeJointParams(element as Joint);
        }
        break;
      default:
        console.log(
          'Unknown object type: ' + element!.objectType + ', id: ' + id,
        );
        return;
    }

    const objectA = this.rapierObjects.get(element.objectA)?.rigidBody;
    const objectB = this.rapierObjects.get(element.objectB)?.rigidBody;

    let constraint = this.rapierWorld.createImpulseJoint(
      constraintParams,
      objectA!,
      objectB!,
      true,
    );

    constraint.setContactsEnabled(false);

    if (
      element.objectType === ObjectType.Joint &&
      (element as Joint).hasMotor === true
    ) {
      let intermidiateJoint = element as Joint;
      console.log(intermidiateJoint.motor);

      (constraint as RAPIER.RevoluteImpulseJoint).configureMotorVelocity(
        intermidiateJoint.motor.targetVelocity,
        0,
      );
    }
  }

  public initialize(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  public setupPhysics(): void {
    this.rapierWorld = new RAPIER.World(new Vector2(0, 9.81));
    this.rapierWorld.integrationParameters.dt = (8 * 1) / 60;

    this.sceneObjectSharedService.getSceneObjectIds().forEach((id) => {
      if (id === undefined) {
        console.log('ID not found: ' + id);
        return;
      }

      let element = this.sceneObjectSharedService.getSceneObjectById(id);

      if (!element) {
        console.log('Element not found, id: ' + id);
        return;
      }

      if (isDynamicObject(element)) {
        this.dynamicObjectSetup(element as DynamicObject, id);
      } else {
        this.constraintSetup(element as Constraint, id);
      }
    });

    const pendulum = this.rapierObjects.get('4')?.rigidBody;
    const stick = this.rapierObjects.get('24')?.rigidBody;

    const revoluteParams = RAPIER.JointData.revolute(
      { x: 0.0, y: 0.0 },
      { x: 390, y: 0.0 },
    );

    let testJoint = this.rapierWorld.createImpulseJoint(
      revoluteParams,
      pendulum!,
      stick!,
      true,
    );

    testJoint.setContactsEnabled(false);
    (testJoint as RAPIER.RevoluteImpulseJoint).configureMotorVelocity(2.0, 1.0);
  }

  public resetPhysics(): void {
    this.rapierObjects.clear();
    this.setupPhysics();
  }

  public stepForward(): void {
    if (!this.canvas) {
      console.log('Canvas not initialized!');
      return;
    }

    if (!this.rapierWorld) {
      console.log('Rapier world not initialized!');
      return;
    }

    this.rapierWorld.step();

    this.canvas.getObjects().forEach((canvasObject) => {
      let id = canvasObject.name;
      if (!id) {
        console.log('ID not found, id: ' + id);
        return;
      }

      const collider = this.rapierObjects.get(id)?.collider;
      if (!collider) {
        console.log('Collider not found, id: ' + id);
        return;
      }

      if (canvasObject.type !== 'polygon') {
        canvasObject.set({
          left: collider.translation().x,
          top: collider.translation().y,
          angle: this.rotationConverterService.radiansToDegrees(
            collider.rotation(),
          ),
        });
      } else {
        const points = (
          this.sceneObjectSharedService.getSceneObjectById(
            id,
          ) as Polygon
        ).points;

        const centerOfMass =
          this.rapierObjects.get(id)?.colliderDesc.centerOfMass;
        if (!centerOfMass) {
          console.log('Center of mass not found, id: ' + id);
          return;
        }

        const offset = this.calculateShapeOffset(points, centerOfMass);
        const rad = collider.rotation();

        canvasObject.set({
          left:
            collider.translation().x -
            offset.x * Math.cos(rad) +
            offset.y * Math.sin(rad),
          top:
            collider.translation().y -
            offset.x * Math.sin(rad) -
            offset.y * Math.cos(rad),
          angle: this.rotationConverterService.radiansToDegrees(rad),
        });
      }

      canvasObject.setCoords(); // Update canvas object location.
    });

    this.canvas.requestRenderAll();
  }
}
