import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { v4 as uuidV4 } from 'uuid';

import { Rectangle, Circle, Polygon, SceneObject, DynamicObject } from '../model/scene.model';
import { Pair } from '../model/pair';
import * as RecordValue from '../model/record-value.model';

import {
  ObjectModificationRecord,
  ModificationType,
} from 'src/app/model/object-modification-record.model';

@Injectable({
  providedIn: 'root',
})
export class SceneObjectsSharedService {
  private sceneObjects = new ReplaySubject<Map<string, SceneObject>>(1);
  private newObjectAddedSignal = new ReplaySubject<{
    id: string;
    sceneObject: SceneObject;
  }>(1);
  private removeObjectSignal = new ReplaySubject<string>(1);
  //For clarity, undoRecords is for object to undo, not record for undo itself
  private undoRecords: ObjectModificationRecord[] = [];
  //Same as the undoRecords.
  private redoRecords: ObjectModificationRecord[] = [];

  public getSceneObjects$(): Observable<Map<string, SceneObject>> {
    return this.sceneObjects.asObservable();
  }

  public setSceneObjects(data: Map<string, SceneObject>): void {
    this.sceneObjects.next(data);
  }

  public getSceneObjectById(id: string): SceneObject | undefined {
    let sceneObject: SceneObject | undefined;

    this.sceneObjects.pipe(take(1)).subscribe((sceneObjectMap) => {
      sceneObject = sceneObjectMap.get(id);
    });

    return sceneObject;
  }

  public getSceneObjectIndexById(id: string): number {
    let index = 0;
    this.sceneObjects.pipe(take(1)).subscribe((sceneObjectMap) => {
      let ids = [...sceneObjectMap.keys()];
      index = ids.indexOf(id);
    });
    return index;
  }

  public setSceneObjectById(id: string, data: SceneObject): void {
    console.log('Set scene object with id: ' + id, data);

    this.sceneObjects.pipe(take(1)).subscribe((sceneObjectMap) => {
      sceneObjectMap.set(id, data);

      this.sceneObjects.next(sceneObjectMap);
    });
  }

  public getSceneObjectIds() {
    let sceneObjectIds: string[] = [];

    this.sceneObjects.pipe(take(1)).subscribe((sceneObjectMap) => {
      sceneObjectIds = Array.from(sceneObjectMap.keys());
    });

    return sceneObjectIds;
  }

  public getSceneObjectIdNamePairs(): Observable<Pair<string, string>[]> {
    return this.sceneObjects.pipe(
      take(1),
      map((sceneObjectMap) => {
        const pairs: Pair<string, string>[] = [];

        sceneObjectMap.forEach((sceneObject, id) => {
          pairs.push(new Pair(id, sceneObject.name));
        });

        return pairs;
      }),
    );
  }

  public addSceneObject(sceneObject: SceneObject): string {
    this.sceneObjects.pipe(take(1)).subscribe((sceneObjectMap) => {
      const newId = this.generateUniqueId(sceneObjectMap);
      sceneObjectMap.set(newId, sceneObject);

      this.sceneObjects.next(sceneObjectMap);
      this.sendNewObjectAddedSignal(newId, sceneObject);
      return newId;
    });
    return '';
  }

  //For preserving the original id for the object deleted
  public addSceneObjectWithId(insertIndex: number, id: string, sceneObject: SceneObject): void {
    this.sceneObjects.pipe(take(1)).subscribe((sceneObjectMap) => {
      let newMap: Map<string, SceneObject> = new Map<string,SceneObject>();
      let ids = [...sceneObjectMap.keys()];

      if(ids.length === 0){
        newMap.set(id,sceneObject);
        this.sceneObjects.next(newMap);
        this.sendNewObjectAddedSignal(id, sceneObject);
        return;
      }
      let index = 0;
      sceneObjectMap.forEach((item) => {
        if(insertIndex === 0){
          newMap.set(id,sceneObject);
        }
        newMap.set(ids[index], item);
        if (insertIndex - 1 === index) {
          newMap.set(id,sceneObject);
        }
        index++;
      });

      this.sceneObjects.next(newMap);
      this.sendNewObjectAddedSignal(id, sceneObject);
    });
  }

  public removeSceneObject(id: string): void {
    this.sceneObjects.pipe(take(1)).subscribe((sceneObjectMap) => {
      sceneObjectMap.delete(id);

      this.sceneObjects.next(sceneObjectMap);
    });
  }

  private generateUniqueId(sceneObjectMap: Map<string, SceneObject>): string {
    // Generate a new unique ID based on existing IDs
    let newId = uuidV4();

    // Ensure the generated ID is unique
    while (sceneObjectMap.has(newId)) {
      newId = uuidV4();
    }

    return newId;
  }

  public getNewObjectAddedSignal$(): Observable<{
    id: string;
    sceneObject: SceneObject;
  }> {
    return this.newObjectAddedSignal.asObservable();
  }

  private sendNewObjectAddedSignal(id: string, sceneObject: SceneObject): void {
    this.newObjectAddedSignal.next({ id: id, sceneObject: sceneObject });
  }

  public getRemoveObjectSignal$(): Observable<string> {
    return this.removeObjectSignal.asObservable();
  }

  public sendRemoveObjectSignal(id: string): void {
    this.removeSceneObject(id);
    this.removeObjectSignal.next(id);
  }

  /**
   * `Create` type dosen't need ids
   */
  public sendRecordObjectModificationSignal(modifyType: ModificationType, values: RecordValue.RecordsValue, ids: string[], modifiedObjects: SceneObject[]) {
    this.undoRecords.push({
      type: modifyType,
      value: values,
      ids: ids,
      modifiedObjects: modifiedObjects,
    });
    this.redoRecords = [];
  }

  public getUndoRecordsSignal(): {
    ids: string[];
    type: ModificationType;
  } | null {
    let undoRecord = this.undoRecords.pop();
    if (!undoRecord) {
      return null;
    }
    this.redoRecords.push(undoRecord);

    return this.undoRecordProcessor(undoRecord);
  }

  public getRedoRecordsSignal(): {
    ids: string[];
    type: ModificationType;
  } | null {
    let redoRecord = this.redoRecords.pop()!;
    if (!redoRecord) {
      return null;
    }
    this.undoRecords.push(redoRecord);

    return this.redoRecordProcessor(redoRecord);
  }

  private undoRecordProcessor(record: ObjectModificationRecord):  { ids: string[], type: ModificationType} | null {
    let type = record.type;
    let ids: string[] = [];

    switch (type) {
      case ModificationType.Create :

        ids = this.getSceneObjectIds().slice(-record.modifiedObjects.length);

        ids.forEach((id) => {
          this.sendRemoveObjectSignal(id);
        });
        break;

      case ModificationType.Remove:
        
        ids = record.ids;

        
        let recordIndex = (record.value as number[]);

        let recordBundle: {index: number, object: SceneObject}[] = [];

        for(let index = 0; index < recordIndex.length; index++){
          recordBundle.push({index:recordIndex[index],object:record.modifiedObjects[index]});
        }

        recordBundle.sort((a,b)=>{return a.index - b.index});

        for (let index = 0; index < ids.length; index++) {
          this.addSceneObjectWithId(  recordBundle[index].index ,ids[index], recordBundle[index].object);
        }
        break;

      case ModificationType.Move:
      case ModificationType.Rotate:
      case ModificationType.Scale:
      case ModificationType.SetName:
      case ModificationType.SetIsStatic:
      case ModificationType.SetPositionX:
      case ModificationType.SetPositionY:
      case ModificationType.SetDimensionWidth:
      case ModificationType.SetDimensionHeight:
      case ModificationType.SetRadius:
      case ModificationType.SetRotation:
      case ModificationType.SetMass:
      case ModificationType.SetStaticFriction:
      case ModificationType.SetKineticFriction:
      case ModificationType.SetLinearVelocityX:
      case ModificationType.SetLinearVelocityY:
      // case ModificationType.Group:
      // case ModificationType.Ungroup:
      // case ModificationType.SetPoints:
      // case ModificationType.SetAngularVelocity:
      case ModificationType.SetHasFill:
      case ModificationType.SetFillColor:
      case ModificationType.SetHasBorder:
      case ModificationType.SetBorderColor:
      case ModificationType.SetBorderThickness:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {
          this.setSceneObjectById(ids[index], record.modifiedObjects[index]);
        }

        break;
      default:
        return null;
    }
    return { ids, type };
  }

  private redoRecordProcessor(record: ObjectModificationRecord): { ids: string[], type: ModificationType} | null {
    let type = record.type;
    let ids: string[] = [];

    switch (type) {
      case ModificationType.Create :

        let sceneObjectsMapLength = this.getSceneObjectIds().length;

        record.modifiedObjects.forEach((obj) => {
          let newId = this.addSceneObject(obj);
          ids.push(newId);
          sceneObjectsMapLength += 1;
        });

      break;

      case ModificationType.Remove :

        ids = record.ids;

        ids.forEach((id)=>{ 
          this.sendRemoveObjectSignal(id);
        });

      break;
      
      case ModificationType.Move :

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {

        let newObject = {
          ...record.modifiedObjects[index],
          position: {
            x: (record.value as RecordValue.Move).positions[index].x,
            y: (record.value as RecordValue.Move).positions[index].y
          },
        } as SceneObject;
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;

      case ModificationType.Rotate:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {
          let newObject = {
            ...record.modifiedObjects[index],
            rotation: record.modifiedObjects[index].rotation + (record.value as RecordValue.Rotate).degreeOffset,
            ...(ids.length > 1 && { //I don't know what is this, but chatgpt suggest it... so why not?
              position: {
                x: (record.value as RecordValue.Rotate).positions[index].x,
                y: (record.value as RecordValue.Rotate).positions[index].y,
              }
            })
          } as SceneObject

          this.setSceneObjectById(ids[index],newObject);
        }

      break;

      case ModificationType.Scale:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {

          let object = record.modifiedObjects[index] as Rectangle & Circle & Polygon;

          let newObject = {
            ...object,
            ...(object.dimension! &&
              {
              dimension: (record.value as RecordValue.Scale).scaledAttributes[index]
            }),
            ...(object.radius! && {
              radius: (record.value as RecordValue.Scale).scaledAttributes[index]
            }),
            ...(object.points! && {
              points: (record.value as RecordValue.Scale).scaledAttributes[index]
            }),
            position: {
              x: (record.value as RecordValue.Scale).positions[index].x,
              y: (record.value as RecordValue.Scale).positions[index].y,
            }
          } as SceneObject

          this.setSceneObjectById(ids[index],newObject);
        }

      break;

      case ModificationType.SetName:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {
          let newObject = {
            ...record.modifiedObjects[index],
            name: record.value
          } as SceneObject
          
          this.setSceneObjectById(ids[index],newObject);
        }

      break;

      case ModificationType.SetIsStatic:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {
          let newObject = {
            ...record.modifiedObjects[index],
            isStatic: record.value
          } as SceneObject
          
          this.setSceneObjectById(ids[index],newObject);
        }

      break;

      case ModificationType.SetPositionX:
        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {

          let newObject = {
            ...record.modifiedObjects[index],
            position: {
              ...record.modifiedObjects[index].position,
              x: record.modifiedObjects[index].position.x + (record.value as number),
            },
          } as SceneObject;
          
          this.setSceneObjectById(ids[index],newObject);
        }

      break;

      case ModificationType.SetPositionY:
        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {

          let newObject = {
            ...record.modifiedObjects[index],
            position: {
              ...record.modifiedObjects[index].position,
              y: record.modifiedObjects[index].position.y + (record.value as number),
            },
          } as SceneObject;
          
          this.setSceneObjectById(ids[index],newObject);
        }
      break;

      case ModificationType.SetDimensionWidth:
        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {

          let newObject = {
            ...record.modifiedObjects[index],
            dimension: {
              ...(record.modifiedObjects[index] as Rectangle).dimension,
              width: record.value,
            },
          } as SceneObject;
          
          this.setSceneObjectById(ids[index],newObject);
        }
      break;

      case ModificationType.SetDimensionHeight:
        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {

          let newObject = {
            ...record.modifiedObjects[index],
            dimension: {
              ...(record.modifiedObjects[index] as Rectangle).dimension,
              height: record.value,
            },
          } as SceneObject;
          
          this.setSceneObjectById(ids[index],newObject);
        }
      break;
      
      case ModificationType.SetRadius:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {
          let newObject = {
            ...record.modifiedObjects[index],
            radius: record.value,
          } as SceneObject;

          this.setSceneObjectById(ids[index],newObject);
        }
      break;

      case ModificationType.SetRotation:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          rotation: record.modifiedObjects[index].rotation + (record.value as RecordValue.Rotate).degreeOffset,
          ...(ids.length > 1 && { //I don't know what is this, but chatgpt suggest it... so why not?
            position: {
              x: (record.value as RecordValue.Rotate).positions[index].x,
              y: (record.value as RecordValue.Rotate).positions[index].y,
            }
          })
        } as SceneObject

        this.setSceneObjectById(ids[index],newObject);
      }

      break;

      case ModificationType.SetMass:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {
          let newObject = {
            ...record.modifiedObjects[index],
            mass: record.value,
          } as SceneObject;

          this.setSceneObjectById(ids[index],newObject);
        }
      break;

      case ModificationType.SetStaticFriction:

        ids = record.ids;

        for (let index = 0; index < ids.length; index++) {
          let newObject = {
            ...record.modifiedObjects[index],
            friction:{
              ...(record.modifiedObjects[index] as DynamicObject).friction,
              static: record.value,
            }
          } as SceneObject
          
          this.setSceneObjectById(ids[index],newObject);
        }
      break;
      
      case ModificationType.SetKineticFriction:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          friction:{
            ...(record.modifiedObjects[index] as DynamicObject).friction,
            kinetic: record.value,
          }
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;

      case ModificationType.SetLinearVelocityX:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          linearVelocity:{
            ...(record.modifiedObjects[index] as DynamicObject).linearVelocity,
            x: record.value,
          }
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;

      case ModificationType.SetLinearVelocityY:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          linearVelocity:{
            ...(record.modifiedObjects[index] as DynamicObject).linearVelocity,
            y: record.value,
          }
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;
      // case ModificationType.Group:
      // case ModificationType.Ungroup:
      // case ModificationType.SetPoints:
      // case ModificationType.SetAngularVelocity:
      case ModificationType.SetHasFill:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          hasFill: record.value,
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;

      case ModificationType.SetFillColor:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          fillColor: record.value,
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;

      case ModificationType.SetHasBorder:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          hasBorder: record.value,
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;
      
      case ModificationType.SetBorderColor:

      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          borderColor: record.value,
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;

      case ModificationType.SetBorderThickness:
      
      ids = record.ids;

      for (let index = 0; index < ids.length; index++) {
        let newObject = {
          ...record.modifiedObjects[index],
          borderThickness: record.value,
        } as SceneObject
        
        this.setSceneObjectById(ids[index],newObject);
      }
      break;

      default:
        return null;
    }
    return { ids, type };
  }
}
