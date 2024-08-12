import { Component, ViewChild } from '@angular/core';
import { Cons, Subject, takeUntil } from 'rxjs';

import { BasePanelComponent } from './base-panel.component';
import { SceneObjectsSharedService } from 'src/app/services/scene-objects-shared.service';
import { SelectedObjectPropertiesSharedService } from 'src/app/services/selected-object-properties-shared.service';
import { RotationConverterService } from 'src/app/services/rotation-converter.service';
import { HexOpacityConverterService } from 'src/app/services/hex-opacity-converter.service';
import { HSV } from 'src/app/model/color-formats.model';
import { ModificationType } from 'src/app/model/object-modification-record.model';
import { Pair } from 'src/app/model/pair';

import { WorldOriginSharedService } from 'src/app/services/world-origin.shared.service';
import { WorldOriginUtil } from '../viewport/world-origin.util';

import {
  SceneObject,
  isDynamicObject,
  Rectangle,
  Circle,
  Ramp,
  Polygon,
  Rope,
  Spring,
  Joint,
  Sensor,
  ObjectType,
  DynamicObject,
  Constraint,
} from 'src/app/model/scene.model';

@Component({
  selector: 'properties-panel',
  templateUrl: './properties-panel.component.html',
  styleUrls: [
    './properties-panel.component.css',
    './base-panel.component.css',
    '../../../styles.css',
  ],
})
export class PropertiesPanelComponent extends BasePanelComponent {
  protected isVectorForm: boolean = false;
  protected noConstraintWarning: string = 'Select an object';
  protected objectIdNamePair: Pair<string, string>[] = [];

  private selectedObjects: (SceneObject | undefined)[] = [];
  private selectedIds: string[] = [];
  private lastSelectedId?: string = '-1';
  private lastSelectedObject?: SceneObject | undefined;
  private originalObjects: SceneObject[] = []; // For fill and border un/redo record

  @ViewChild('basePanel', { static: true })
  basePanelElementRef!: BasePanelComponent;

  constructor(
    private sceneObjectsSharedService: SceneObjectsSharedService,
    private selectedObjectPropertiesSharedService: SelectedObjectPropertiesSharedService,
    private rotationConverterService: RotationConverterService,
    private worldOriginSharedService: WorldOriginSharedService
  ) {
    super();
  }

  private unsubscribe = new Subject<void>();

  protected expandFillColorPicker: boolean = false;
  protected renderFillColorPicker: boolean = false;
  protected expandBorderColorPicker: boolean = false;
  protected renderBorderColorPicker: boolean = false;

  ngOnInit(): void {
    this.sceneObjectsSharedService
      .getSceneObjectIdNamePairs()
      .subscribe((sceneObjectIdNamePairs) => {
        if (sceneObjectIdNamePairs !== this.objectIdNamePair) {
          this.objectIdNamePair = sceneObjectIdNamePairs;
        }

        this.sceneObjectsSharedService
          .getNewObjectAddedSignal$()
          .subscribe((data: { id: string; sceneObject: SceneObject }) => {
            const pair: Pair<string, string> = new Pair(
              data.id,
              data.sceneObject.name
            );
            this.objectIdNamePair.push(pair);
            //I don't really understand how the return part works, but it sort it by.
            // this.objectIdNamePair.sort((pair1, pair2) => {
            //   return pair1.first - pair2.first;
            // });
          });

        this.sceneObjectsSharedService
          .getRemoveObjectSignal$()
          .subscribe((id: string) => {
            let index = this.objectIdNamePair
              .map((objectIdNamePair) => {
                return objectIdNamePair.first;
              })
              .indexOf(id);
            this.objectIdNamePair.splice(index, 1);
          });

        this.selectedObjectPropertiesSharedService
          .getPropertyChangedSignal$()
          .subscribe(() => {
            this.objectIdNamePair.forEach((pair) => {
              let index = this.objectIdNamePair.indexOf(pair);
              let newObj = this.sceneObjectsSharedService.getSceneObjectById(
                pair.first
              );
              if (newObj?.name !== pair.second) {
                this.objectIdNamePair[index].second = newObj?.name!;
              }
            });
          });
      });

    this.selectedObjectPropertiesSharedService
      .getSelectedObjectId$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((ids) => {
        this.selectedIds = ids;
        this.expandFillColorPicker = false;
        this.renderFillColorPicker = false;
        this.expandBorderColorPicker = false;
        this.renderBorderColorPicker = false;
        this.getSelectedObjects();
      });

    this.selectedObjectPropertiesSharedService
      .getPropertyChangedSignal$()
      .subscribe(() => {
        this.updateSelectedObjects();
      });
  }

  private getSelectedObjects(): void {
    this.selectedObjects = [];
    this.lastSelectedId = '-1';
    this.selectedIds.forEach((id) => {
      this.selectedObjects?.push(
        this.sceneObjectsSharedService.getSceneObjectById(id)
      );
      this.lastSelectedId = id;
      this.lastSelectedObject =
        this.sceneObjectsSharedService.getSceneObjectById(id);
    });
  }

  private updateSelectedObjects(): void {
    for (let index = 0; index < this.selectedIds.length; index++) {
      let id = this.selectedIds[index];
      let newObject = this.sceneObjectsSharedService.getSceneObjectById(id);

      if (newObject !== this.selectedObjects![index]) {
        // Fetch the most up-to-date version of the selected object.
        this.selectedObjects![index] = newObject;
        this.lastSelectedObject = newObject;
      }
    }
  }

  private selectedObjectPropertyChanged(): void {
    for (let index = 0; index < this.selectedIds.length; index++) {
      this.sceneObjectsSharedService.setSceneObjectById(
        this.selectedIds[index],
        this.selectedObjects![index]!
      );
      //This if is not necessary but whatever
      if (index === this.selectedIds.length - 1) {
        this.lastSelectedObject = this.selectedObjects![index]!;
        this.selectedObjectPropertiesSharedService.sendPropertyChangedSignal();
      }
    }
  }

  protected getIsMultiEditing(): boolean {
    return this.selectedObjects.length > 1;
  }

  protected getSelectedId(): string {
    return this.lastSelectedId!;
  }

  protected getName(): string {
    return this.lastSelectedObject?.name || '';
  }

  protected setName(value: string) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        name: value /*  + (this.selectedIds.length > 1 ? '_' + index : '') */,
      } as SceneObject;
      this.selectedObjectPropertyChanged();
    }
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetName,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getIsStatic(): boolean {
    let lastSelectedObject: DynamicObject;

    for (let index = 0; index < this.selectedObjects.length; index++) {
      let selectedObject = this.selectedObjects[index] as DynamicObject;
      lastSelectedObject = this.lastSelectedObject as DynamicObject;

      if (selectedObject.isStatic !== lastSelectedObject.isStatic) {
        return true;
      }
    }

    return lastSelectedObject!.isStatic || false;
  }

  protected setIsStatic(value: boolean) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedObjects.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        isStatic: value,
      } as SceneObject;
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetIsStatic,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getX(): string {
    let x = this.lastSelectedObject?.position?.x || 0;

    return WorldOriginUtil.toObjectPositionX(
      x,
      this.worldOriginSharedService.getWorldOrigin().x
    ).toString();
  }

  protected setX(value: number) {
    value = WorldOriginUtil.toViewportPositionX(
      value,
      this.worldOriginSharedService.getWorldOrigin().x
    );

    //Everything will stay at the same distance with each other
    let offset = value - this.lastSelectedObject?.position.x!;
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedObjects.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        position: {
          ...this.selectedObjects[index]?.position,
          x: this.selectedObjects[index]?.position.x! + offset,
        },
      } as SceneObject;
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetPositionX,
      offset,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
    //Everything will move to the same point
    // this.selectedObjects.forEach((obj)=>{
    //   obj = {
    //     ...obj,
    //     position: {
    //       ...obj.position,
    //       x: value,
    //     },
    //   } as SceneObject;
    //   this.selectedObjectPropertyChanged();
    // });
  }

  protected getY(): string {
    let y = this.lastSelectedObject?.position?.y || 0;

    return WorldOriginUtil.toObjectPositionY(
      y,
      this.worldOriginSharedService.getWorldOrigin().y
    ).toString();
  }

  protected setY(value: number) {
    value = WorldOriginUtil.toViewportPositionY(
      value,
      this.worldOriginSharedService.getWorldOrigin().y
    );

    //Everything will stay at the same distance with each other
    let offset = value - this.lastSelectedObject?.position.y!;
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedObjects.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        position: {
          ...this.selectedObjects[index]?.position,
          y: this.selectedObjects[index]?.position.y! + offset,
        },
      } as SceneObject;
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetPositionY,
      offset,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
    //Everything will move to the same point
    // this.selectedObjects.forEach((obj)=>{
    //   obj = {
    //     ...obj,
    //     position: {
    //       ...obj.position,
    //       y: value,
    //     },
    //   } as SceneObject;
    //   this.selectedObjectPropertyChanged();
    // });
  }

  protected getObjectType(): string {
    for (let index = 0; index < this.selectedObjects.length; index++) {
      if (
        this.selectedObjects[index]?.objectType !==
        this.lastSelectedObject?.objectType
      ) {
        return '';
      }
    }
    return this.lastSelectedObject?.objectType || '';
  }

  protected getWidth(): string {
    return (
      (this.lastSelectedObject! as Rectangle)?.dimension.width || 0
    ).toString();
  }

  protected setWidth(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      if (this.selectedObjects[index]?.objectType === ObjectType.Rectangle) {
        this.selectedObjects[index] = {
          ...this.selectedObjects[index],
          dimension: {
            ...(this.selectedObjects[index] as Rectangle).dimension,
            width: value,
          },
        } as SceneObject;
      }
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetDimensionWidth,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getHeight(): string {
    return (
      (this.lastSelectedObject! as Rectangle)?.dimension.height || 0
    ).toString();
  }

  protected setHeight(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      if (this.selectedObjects[index]?.objectType === ObjectType.Rectangle) {
        this.selectedObjects[index] = {
          ...this.selectedObjects[index],
          dimension: {
            ...(this.selectedObjects[index] as Rectangle).dimension,
            height: value,
          },
        } as SceneObject;
      }
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetDimensionHeight,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getRadius(): string {
    return ((this.lastSelectedObject! as Circle)?.radius || 0).toString();
  }

  protected setRadius(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      if (this.selectedObjects[index]?.objectType === ObjectType.Circle) {
        this.selectedObjects[index] = {
          ...this.selectedObjects[index],
          radius: value,
        } as SceneObject;
      }
    }

    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetRadius,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getRotation(): string {
    return (this.lastSelectedObject?.rotation || 0).toString();
  }

  protected setRotation(value: number) {
    let offset = value - this.lastSelectedObject?.rotation!;
    let centerPosition =
      this.selectedObjectPropertiesSharedService.getSelectedObjectsCenterPosition();
    let newPosition: { x: number; y: number }[] = [];
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        rotation: this.selectedObjects[index]?.rotation! + offset,
      } as SceneObject;
      let rad = this.rotationConverterService.degreesToRadians(
        this.selectedObjects[index]?.rotation!
      );
      let offsetX = this.selectedObjects[index]?.position.x! - centerPosition.x;
      let offsetY = this.selectedObjects[index]?.position.y! - centerPosition.y;
      let newX =
        centerPosition.x + offsetX * Math.cos(rad) - offsetY * Math.sin(rad);
      let newY =
        centerPosition.y + offsetX * Math.sin(rad) + offsetY * Math.cos(rad);
      newPosition.push({ x: newX, y: newY });
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetRotation,
      { degreeOffset: offset, positions: newPosition },
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getMass(): string {
    return ((this.lastSelectedObject as DynamicObject).mass || 0).toString();
  }

  protected setMass(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        mass: value,
      } as SceneObject;
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetMass,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getStaticFriction(): string {
    return (
      (this.lastSelectedObject as DynamicObject).friction?.static || 0
    ).toString();
  }

  protected setStaticFriction(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        friction: {
          ...(this.selectedObjects[index] as DynamicObject).friction,
          static: value,
        },
      } as SceneObject;
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetStaticFriction,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getKineticFriction(): string {
    return (
      (this.lastSelectedObject as DynamicObject).friction?.kinetic || 0
    ).toString();
  }

  protected setKineticFriction(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        friction: {
          ...(this.selectedObjects[index] as DynamicObject).friction,
          kinetic: value,
        },
      } as SceneObject;
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetKineticFriction,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getLinearVelocityX(): string {
    return (
      (this.lastSelectedObject as DynamicObject).linearVelocity?.x ?? 0
    ).toString();
  }

  protected setLinearVelocityX(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      let originalObject = {
        ...this.selectedObjects[index]!,
      } as SceneObject;
      originalData.push(originalObject);
      (this.selectedObjects[index]! as DynamicObject).linearVelocity = {
        ...(this.selectedObjects[index]! as DynamicObject).linearVelocity,
        x: value,
      };
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetLinearVelocityX,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getLinearVelocityY(): string {
    return (
      (this.lastSelectedObject as DynamicObject).linearVelocity?.y ?? 0
    ).toString();
  }

  protected setLinearVelocityY(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      let originalObject = {
        ...this.selectedObjects[index]!,
      } as SceneObject;
      originalData.push(originalObject);
      (this.selectedObjects[index]! as DynamicObject).linearVelocity = {
        ...(this.selectedObjects[index]! as DynamicObject).linearVelocity,
        y: value,
      };
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetLinearVelocityY,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getLinearVelocityMagnitude(): string {
    if ((this.lastSelectedObject as DynamicObject).linearVelocity) {
      const { x, y } = (this.lastSelectedObject as DynamicObject)
        .linearVelocity;
      return (Math.sqrt(x * x + y * y) || 0).toString();
    }
    return '0';
  }

  protected setLinearVelocityMagnitude(value: number) {
    for (let index = 0; index < this.selectedIds.length; index++) {
      if ((this.selectedObjects[index] as DynamicObject).linearVelocity) {
        const angle = this.rotationConverterService.degreesToRadians(
          parseFloat(this.getLinearVelocityAngle())
        );
        (this.selectedObjects[index]! as DynamicObject).linearVelocity = {
          ...(this.selectedObjects[index]! as DynamicObject).linearVelocity,
          x: value * Math.cos(angle),
          y: value * Math.sin(angle),
        };
      }
    }
    this.selectedObjectPropertyChanged();
  }

  protected getLinearVelocityAngle(): string {
    if ((this.lastSelectedObject as DynamicObject).linearVelocity) {
      const { x, y } = (this.lastSelectedObject as DynamicObject)
        .linearVelocity;
      return this.rotationConverterService
        .radiansToDegrees(Math.atan2(y, x))
        .toString();
    }
    return '0';
  }

  protected setLinearVelocityAngle(angle: number) {
    for (let index = 0; index < this.selectedIds.length; index++) {
      if ((this.selectedObjects[index] as DynamicObject).linearVelocity) {
        const velocity = parseFloat(this.getLinearVelocityMagnitude());
        const radians = this.rotationConverterService.degreesToRadians(angle);
        (this.selectedObjects[index]! as DynamicObject).linearVelocity = {
          ...(this.selectedObjects[index]! as DynamicObject).linearVelocity,
          x: velocity * Math.cos(radians),
          y: velocity * Math.sin(radians),
        };
      }
    }
    this.selectedObjectPropertyChanged();
  }

  protected toggleFillColorPicker(event: Event) {
    this.expandFillColorPicker = !this.expandFillColorPicker;

    // Unrender the fill color picker after 500ms
    if (!this.expandFillColorPicker) {
      setTimeout(() => {
        this.renderFillColorPicker = false;
      }, 500);
    }
    {
      this.renderFillColorPicker = true;
    }

    if (this.expandFillColorPicker && this.basePanelElementRef) {
      this.expandBorderColorPicker = false;
      this.basePanelElementRef.scrollToBottom();
    }
  }

  protected toggleBorderColorPicker(event: Event) {
    this.expandBorderColorPicker = !this.expandBorderColorPicker;

    // Unrender the border color picker after 500ms
    if (!this.expandBorderColorPicker) {
      setTimeout(() => {
        this.renderBorderColorPicker = false;
      }, 500);
    }
    {
      this.renderBorderColorPicker = true;
    }

    if (this.expandBorderColorPicker && this.basePanelElementRef) {
      this.expandFillColorPicker = false;
      this.basePanelElementRef.scrollToBottom();
    }
  }
  
  protected getHasFill(): boolean {
    return this.lastSelectedObject?.hasFill || false;
  }

  protected setHasFill(event: any) {
    let hasFill = event.target.checked;
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        hasFill,
      } as SceneObject;
    }

    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetHasFill,
      hasFill,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getFillColor(): string {
    return this.lastSelectedObject?.fillColor.substring(0, 7) || '';
  }

  protected setFillColor(color: HSV) {
    if (color.toHex() === this.lastSelectedObject?.fillColor.substring(0, 7)) {
      return;
    }
    if (this.originalObjects.length === 0) {
      this.originalObjects = { ...(this.selectedObjects as SceneObject[]) };
    }
    for (let index = 0; index < this.selectedIds.length; index++) {
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        fillColor:
          color.toHex() + this.lastSelectedObject?.fillColor.substring(7, 9),
      } as SceneObject;
    }

    this.selectedObjectPropertyChanged();
  }

  protected getFillOpacity(): number {
    const opacity = this.lastSelectedObject?.fillColor.substring(7, 9) || 'ff';

    return HexOpacityConverterService.hexOpacityToPercentage(opacity);
  }

  protected setFillOpacity(value: any) {
    const opacity = HexOpacityConverterService.percentageToHexOpacity(value);

    if (opacity === this.lastSelectedObject?.fillColor.substring(7, 9)) {
      return;
    }
    if (this.originalObjects.length === 0) {
      this.originalObjects = { ...(this.selectedObjects as SceneObject[]) };
    }
    for (let index = 0; index < this.selectedIds.length; index++) {
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        fillColor:
          this.selectedObjects[index]?.fillColor.substring(0, 7) + opacity,
      } as SceneObject;
    }

    this.selectedObjectPropertyChanged();
  }

  protected finishiFillSetting(color: { hsv: HSV; opacity: number }) {
    let hex =
      color.hsv.toHex() +
      HexOpacityConverterService.percentageToHexOpacity(color.opacity);

    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetFillColor,
      hex,
      this.selectedIds,
      this.originalObjects
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
    this.originalObjects = [];
  }

  protected getHasBorder(): boolean {
    return this.lastSelectedObject?.hasBorder || false;
  }

  protected setHasBorder(event: any) {
    let hasBorder = event.target.checked;
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        hasBorder,
      } as SceneObject;
    }

    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetHasBorder,
      hasBorder,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getBorderColor(): string {
    return this.lastSelectedObject?.borderColor.substring(0, 7) || '';
  }

  protected setBorderColor(color: HSV) {
    if (
      color.toHex() === this.lastSelectedObject?.borderColor.substring(0, 7)
    ) {
      return;
    }
    if (this.originalObjects.length === 0) {
      this.originalObjects = { ...(this.selectedObjects as SceneObject[]) };
    }
    for (let index = 0; index < this.selectedIds.length; index++) {
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        borderColor: color.toHex(),
      } as SceneObject;
    }

    this.selectedObjectPropertyChanged();
  }

  protected getBorderOpacity(): number {
    const opacity =
      this.lastSelectedObject?.borderColor.substring(7, 9) || 'ff';

    return HexOpacityConverterService.hexOpacityToPercentage(opacity);
  }

  protected setBorderOpacity(value: any) {
    const opacity = HexOpacityConverterService.percentageToHexOpacity(value);

    if (opacity === this.lastSelectedObject?.borderColor.substring(7, 9)) {
      return;
    }
    if (this.originalObjects.length === 0) {
      this.originalObjects = { ...(this.selectedObjects as SceneObject[]) };
    }
    for (let index = 0; index < this.selectedIds.length; index++) {
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        borderColor:
          this.selectedObjects[index]?.borderColor.substring(0, 7) + opacity,
      } as SceneObject;
    }

    this.selectedObjectPropertyChanged();
  }

  protected finishiBorderSetting(color: { hsv: HSV; opacity: number }) {
    let hex =
      color.hsv.toHex() +
      HexOpacityConverterService.percentageToHexOpacity(color.opacity);

    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetBorderColor,
      hex,
      this.selectedIds,
      this.originalObjects
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
    this.originalObjects = [];
  }

  protected getBorderThickness(): string {
    return (this.lastSelectedObject?.borderThickness || 0).toString();
  }

  protected getBorderThicknessNumber(): number {
    return this.lastSelectedObject?.borderThickness || 0;
  }

  protected setBorderThickness(value: number) {
    let originalData: SceneObject[] = [];
    for (let index = 0; index < this.selectedIds.length; index++) {
      originalData.push(this.selectedObjects[index]!);
      this.selectedObjects[index] = {
        ...this.selectedObjects[index],
        borderThickness: value,
      } as SceneObject;
    }
    this.selectedObjectPropertyChanged();
    this.sceneObjectsSharedService.sendRecordObjectModificationSignal(
      ModificationType.SetBorderThickness,
      value,
      this.selectedIds,
      originalData
    );
    this.basePanelElementRef.contentElement.nativeElement.focus();
  }

  protected getIsConstraint(): boolean {
    if (!this.lastSelectedObject) {
      return false;
    }

    return !isDynamicObject(this.lastSelectedObject);
  }

  protected getFreeToRotate(): boolean {
    if (!this.lastSelectedObject) {
      return true;
    }

    return !(this.lastSelectedObject as Joint).fixed || true;
  }

  protected setFreeToRotate(value: boolean) {
    for (let index = 0; index < this.selectedIds.length; index++) {
      if (!this.selectedObjects[index]) {
        continue;
      }

      if (isDynamicObject(this.selectedObjects[index]!)) {
        continue;
      }

      (this.selectedObjects[index] as Joint) = {
        ...this.selectedObjects[index],
        fixed: !value,
      } as Joint;

      this.selectedObjectPropertyChanged();
    }
  }

  protected getObjectIdNamePair(): Pair<string, string>[] {
    return this.objectIdNamePair;
  }

  protected isConstraintInOtherDropdown(
    intendedId: string,
    idToCheck: string,
  ): boolean {
    return idToCheck === intendedId.toString();
  }

  protected getConstraintBodyA(): string {
    if (!this.lastSelectedObject) {
      return '';
    }

    if (
      this.sceneObjectsSharedService
        .getSceneObjectIds()
        .includes((this.lastSelectedObject as Constraint).objectA)
    ) {
      return (this.lastSelectedObject as Constraint).objectA;
    }

    return '-1';
  }

  protected setConstraintBodyA(value: string) {
    for (let index = 0; index < this.selectedIds.length; index++) {
      if (!this.selectedObjects[index]) {
        continue;
      }

      if (isDynamicObject(this.selectedObjects[index]!)) {
        continue;
      }

      (this.selectedObjects[index] as Constraint) = {
        ...this.selectedObjects[index],
        objectA: value.toString(),
      } as Constraint;
    }

    this.selectedObjectPropertyChanged();
  }

  protected getConstraintBodyB(): string {
    if (!this.lastSelectedObject) {
      return '-1';
    }

    if (
      this.sceneObjectsSharedService
        .getSceneObjectIds()
        .includes((this.lastSelectedObject as Constraint).objectB)
    ) {
      return (this.lastSelectedObject as Constraint).objectB;
    }

    return '-1';
  }

  protected setConstraintBodyB(value: string) {
    for (let index = 0; index < this.selectedIds.length; index++) {
      if (!this.selectedObjects[index]) {
        continue;
      }

      if (isDynamicObject(this.selectedObjects[index]!)) {
        continue;
      }

      (this.selectedObjects[index] as Constraint) = {
        ...this.selectedObjects[index],
        objectB: value.toString(),
      } as Constraint;
    }

    this.selectedObjectPropertyChanged();
  }

  protected getHasMotor(): boolean {
    if (!this.lastSelectedObject) {
      return false;
    }

    return (this.lastSelectedObject as Joint)?.hasMotor || false;
  }

  protected setHasMotor(value: boolean) {
    for (let index = 0; index < this.selectedIds.length; index++) {
      if (!this.selectedObjects[index]) {
        continue;
      }

      if (isDynamicObject(this.selectedObjects[index]!)) {
        continue;
      }

      (this.selectedObjects[index] as Joint) = {
        ...this.selectedObjects[index],
        hasMotor: value,
      } as Joint;
    }

    this.selectedObjectPropertyChanged();
  }

  protected getTargetVelocity(): string {
    if (!this.lastSelectedObject) {
      return '';
    }

    return (
      (this.lastSelectedObject as Joint)?.motor.targetVelocity.toString() || ''
    );
  }

  protected setTargetVelocity(value: number) {
    for (let index = 0; index < this.selectedIds.length; index++) {
      if (!this.selectedObjects[index]) {
        continue;
      }

      if (isDynamicObject(this.selectedObjects[index]!)) {
        continue;
      }

      (this.selectedObjects[index] as Joint) = {
        ...this.selectedObjects[index],
        motor: {
          ...(this.selectedObjects[index] as Joint).motor,
          targetVelocity: value,
        },
      } as Joint;
    }

    this.selectedObjectPropertyChanged();
  }
}
