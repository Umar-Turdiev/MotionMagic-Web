import { Injectable } from '@angular/core';
import { fabric } from 'fabric';

import {
  Vector2D,
  SceneObject,
  ObjectType,
  Rectangle,
  Circle,
  Polygon,
  Joint,
} from 'src/app/model/scene.model';

@Injectable({
  providedIn: 'root',
})
export class SceneObjectCreationService {
  /**
   * Create a rectangle.
   *
   * @param width - The rectangle width.
   * @param height - The rectangle height.
   *
   * @returns The fabric rectangle.
   */
  public createRectangle(width: number, height: number): fabric.Rect {
    return new fabric.Rect({
      width: width,
      height: height,
    });
  }

  /**
   * Create a circle.
   *
   * @param radius - The circle radius.
   *
   * @returns The fabric circle.
   */
  public createCircle(radius: number): fabric.Circle {
    return new fabric.Circle({
      radius: radius,
    });
  }

  /**
   * Create a polygon.
   *
   * @param points - The poly points.
   *
   * @returns The fabric polygon.
   */
  public createPolygon(points: Vector2D[]): fabric.Polygon {
    return new fabric.Polygon(points);
  }

  /**
   * Set common properties for a fabric object.
   *
   * @param object - The fabric object to modify.
   * @param id - The id of the object.
   * @param x - The x position.
   * @param y - The y position.
   * @param originX - The origin X.
   * @param originY - The origin Y.
   * @param angle - The angle.
   * @param fill - The fill color.
   * @param stroke - The stroke color.
   * @param strokeWidth - The stroke width.
   * @param strokeUniform - The stroke uniform.
   * @param selectable - The selectable.
   *
   * @returns - The modified fabric object.
   */
  public setCommonProperties(
    object: fabric.Object,
    id: string,
    x: number,
    y: number,
    originX: string,
    originY: string,
    angle: number,
    fill: string,
    stroke: string,
    strokeWidth: number,
    strokeUniform: boolean,
    selectable: boolean
  ): fabric.Object {
    object.set({
      name: id,

      left: x,
      top: y,

      originX: originX,
      originY: originY,

      angle: angle,

      fill: fill,
      stroke: stroke,
      strokeWidth: strokeWidth,
      strokeUniform: strokeUniform,

      selectable: selectable,

      perPixelTargetFind: true,
    });

    return object;
  }

  // private adjustPolygonPoints(
  //   points: Vector2D[],
  //   borderWidth: number,
  // ): Vector2D[] {
  //   const adjustedPoints: Vector2D[] = [];

  //   for (let i = 0; i < points.length; i++) {
  //     const currentPoint = points[i];

  //     // Get the previous and next points
  //     const previousPoint = points[i === 0 ? points.length - 1 : i - 1];
  //     const nextPoint = points[i === points.length - 1 ? 0 : i + 1];

  //     // Calculate the direction vectors of the previous and next edges
  //     const prevDirection = this.normalize({
  //       x: currentPoint.x - previousPoint.x,
  //       y: currentPoint.y - previousPoint.y,
  //     });
  //     const nextDirection = this.normalize({
  //       x: nextPoint.x - currentPoint.x,
  //       y: nextPoint.y - currentPoint.y,
  //     });

  //     // Calculate the perpendicular vectors to the previous and next edges
  //     const prevPerpendicular = { x: -prevDirection.y, y: prevDirection.x };
  //     const nextPerpendicular = { x: -nextDirection.y, y: nextDirection.x };

  //     // Calculate the average perpendicular vector
  //     const avgPerpendicular = this.normalize({
  //       x: (prevPerpendicular.x + nextPerpendicular.x) / 2,
  //       y: (prevPerpendicular.y + nextPerpendicular.y) / 2,
  //     });

  //     const adjustedPoint = {
  //       x: currentPoint.x + avgPerpendicular.x * borderWidth,
  //       y: currentPoint.y + avgPerpendicular.y * borderWidth,
  //     };

  //     adjustedPoints.push(adjustedPoint);
  //   }

  //   return adjustedPoints;
  // }

  // private normalize(vector: Vector2D): Vector2D {
  //   const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  //   return { x: vector.x / magnitude, y: vector.y / magnitude };
  // }

  /**
   * Create an object.
   *
   * @param id - The id of the object.
   * @param sceneObject - The scene object.
   * @param originX - The origin X.
   * @param originY - The origin Y.
   * @param allowControl - Allow control.
   *
   * @returns - The created object.
   */
  public createViewportObject(
    id: string,
    sceneObject: SceneObject,
    originX: string = 'center',
    originY: string = 'center',
    allowControl: boolean = false
  ): fabric.Object {
    let object!: fabric.Object;

    if (!sceneObject) {
      return object;
    }

    switch (sceneObject!.objectType) {
      case ObjectType.Rectangle:
        let rectangle = sceneObject as Rectangle;

        object = this.createRectangle(
          rectangle.dimension.width - rectangle.borderThickness,
          rectangle.dimension.height - rectangle.borderThickness
        );

        break;

      case ObjectType.Circle:
        let circle = sceneObject as Circle;

        object = this.createCircle(circle.radius - circle.borderThickness / 2);

        break;

      case ObjectType.Polygon:
        let polygon = sceneObject as Polygon;

        object = this.createPolygon(polygon.points);

        break;

      case ObjectType.Joint:
        let joint = sceneObject as Joint;

        object = this.createCircle(20);

        break;

      default:
        break;
    }

    const fillColor = sceneObject.hasFill
      ? sceneObject.fillColor
      : 'transparent';
    const borderColor = sceneObject.borderColor;
    const borderThickness = sceneObject.hasBorder
      ? sceneObject.borderThickness
      : 0;

    object = this.setCommonProperties(
      object,
      id,
      sceneObject.position.x,
      sceneObject.position.y,
      originX,
      originY,
      sceneObject.rotation,
      fillColor,
      borderColor,
      borderThickness,
      true,
      allowControl
    );

    return object;
  }
}
