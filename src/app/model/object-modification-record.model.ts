import { SceneObject } from './scene.model';
import { RecordsValue } from './record-value.model';

export enum ModificationType {
  Create,
  Remove,

  Group,
  Ungroup,

  Move,
  Rotate,
  Scale,

  SetName,
  SetIsStatic,
  SetPositionX,
  SetPositionY,
  SetDimensionWidth,
  SetDimensionHeight,
  SetRadius,
  SetPoints,
  SetRotation,
  SetMass,
  SetStaticFriction,
  SetKineticFriction,
  SetLinearVelocityX,
  SetLinearVelocityY,
  SetAngularVelocity,
  SetHasFill,
  SetFillColor,
  SetHasBorder,
  SetBorderColor,
  SetBorderThickness,
}
  /**
   * Create a record
   * 
   * Value format will differ due to the types
   * 
   * Please follow the format below :
   * 
   * `type` : `value`
   * 
   * `Create` : `'None'`
   * 
   * `Remove` : number[] 'original index'
   * 
   * `Group`/`Ungroup` : `'None'` (Hasn't finished)
   * 
   * `Move` : `{{x: number, y: number},{x: number, y: number}[]}`
   * 
   * `Rotate` : `{degree:number,positions:{x: number, y: number}}` rotate offset
   * 
   * `Scale` : `{scaleX: number, scaleY: number}`
   * 
   * `SetName` : `string`
   * 
   * `SetIsStatic` : `bool`
   * 
   * `SetPositionX` : number` offset
   * 
   * `SetPositionY` : number` offset
   * 
   * `SetDimensionWidth` : number`
   * 
   * `SetDimensionHeight` : number`
   * 
   * `SetRotation` : `{degree:number,positions:{x: number, y: number}}` rotate offset
   * 
   * `SetRadius` : `number`
   * 
   * `SetPoints` : `Points[]` (Hasn't finished?)
   * 
   * `SetLinearVelocityX` : `number`
   * 
   * `SetLinearVelocityY` : `number`
   * 
   * `SetAngularVelocity` : `number` (Hasn't finished?)
   * 
   * `SetMass` : `number`
   * 
   * `SetStaticFriction` : `number`
   * 
   * `SetKineticFriction` : `number`
   * 
   * `SetHasFill` : `bool`
   * 
   * `SetFillColor` : `string` (hex format)
   * 
   * `SetHasBorder` : `bool`
   * 
   * `SetBorderColor` : `string` (hex format)
   * 
   * `SetBorderThickness` : `number`
   * 
   * @param type - The type of modification
   * @param value - The value of changes
   * @param modifiedObjects - The original objects (original datas) 
   */
export class ObjectModificationRecord {
  constructor(
    public type: ModificationType,
    public value: RecordsValue,
    public ids: string[],
    public modifiedObjects: SceneObject[],
  ) {}
}
