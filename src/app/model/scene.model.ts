export enum LengthUnit {
  Centimeter = 'cm',
  Meter = 'm',
  Kilometer = 'km',
  Inch = 'inch',
  Mile = 'mile',
}

export enum AngleUnit {
  Degree = '°',
  Radian = 'rad',
}

export enum MassUnit {
  Gram = 'g',
  Kilogram = 'kg',
  Pound = 'lb',
}

export enum LinearVelocityUnit {
  MeterPerSecond = 'm/s',
  KilometerPerHour = 'km/h',
  MilePerHour = 'mph',
  FeetPerSecond = 'ft/s',
  Knot = 'kn',
}

export enum AccelerationUnit {
  MeterPerSecondSquared = 'm/s^2',
}

export enum ObjectType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Ramp = 'ramp',
  Polygon = 'polygon',
  Rope = 'rope',
  Spring = 'spring',
  Joint = 'joint',
  Sensor = 'sensor',
}

export interface SceneSettings {
  gravity: { x: number; y: number; unit: AccelerationUnit };
  time_step: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface BaseObject {
  name: string;
  objectType: ObjectType;
  position: Vector2D;
  rotation: number;
  hasFill: boolean;
  fillColor: string;
  hasBorder: boolean;
  borderColor: string;
  borderThickness: number;
}

export interface DynamicObject extends BaseObject {
  isStatic: boolean;
  mass: number;
  friction: { static: number; kinetic: number };
  linearVelocity: Vector2D;
  lengthUnit: LengthUnit;
  angleUnit: AngleUnit;
  massUnit: MassUnit;
  linearVelocityUnit: LinearVelocityUnit;
}

export interface Rectangle extends DynamicObject {
  dimension: { width: number; height: number };
}

export interface Circle extends DynamicObject {
  radius: number;
}

export interface Ramp extends DynamicObject {
  sides: { adjecentSide: number; oppositeSide: number; hypotenuse: number };
  theta: number;
}

export interface Polygon extends DynamicObject {
  points: Vector2D[];
}

export interface Constraint extends BaseObject {
  objectA: string;
  offsetA: Vector2D;
  objectB: string;
  offsetB: Vector2D;
}

export interface Rope extends Constraint {
  length: number;
}

export interface Spring extends Constraint {
  length: number;
  stiffness: number;
  damping: number;
}

export interface Joint extends Constraint {
  radius: number;
  fixed: boolean;
  hasMotor: boolean;
  motor: {
    targetVelocity: number;
    targetPosition: number;
    stiffness: number;
    damping: number;
  };
}

export interface Sensor extends BaseObject {
  radius: number;
  onTrigger: (id: string) => void;
}

/**
 * Object that has a real shape.
 */
export type SceneObject =
  | Rectangle
  | Circle
  | Ramp
  | Polygon
  | Rope
  | Spring
  | Joint
  | Sensor;

export interface Scene {
  scene_name: string;
  author: string;
  created_at: string;
  last_modified_at: string;
  settings: SceneSettings;
  objects: { [key: string]: SceneObject };
}

export function isDynamicObject(object: SceneObject): boolean {
  return !('objectA' in object);
}
