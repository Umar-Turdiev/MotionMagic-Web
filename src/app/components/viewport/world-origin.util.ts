import { fabric } from 'fabric';

export class WorldOrigin extends fabric.Group {
  constructor(options?: fabric.IGroupOptions) {
    super([], options);

    const arrow1 = new fabric.Triangle({
      width: 35,
      height: 40,
      fill: 'white',
      left: 0,
      top: -150,
      selectable: false,
      originX: 'center',
      originY: 'bottom',
    });

    const rectangle1 = new fabric.Rect({
      width: 9,
      height: 180,
      fill: 'white',
      left: 0,
      top: 30,
      selectable: false,
      originX: 'center',
      originY: 'bottom',
    });

    const arrow2 = new fabric.Triangle({
      width: 35,
      height: 40,
      fill: 'white',
      left: 150,
      top: 0,
      angle: 90,
      selectable: false,
      originX: 'center',
      originY: 'bottom',
    });

    const rectangle2 = new fabric.Rect({
      width: 180,
      height: 9,
      fill: 'white',
      left: -30,
      top: 0,
      selectable: false,
      originX: 'left',
      originY: 'center',
    });

    this.addWithUpdate(arrow1);
    this.addWithUpdate(rectangle1);
    this.addWithUpdate(arrow2);
    this.addWithUpdate(rectangle2);

    this.setControlsVisibility({
      mt: false,
      mb: false,
      ml: false,
      mr: false,
      mtr: false,
    });
    // this.selectable = true;
    this.selectable = false; // disable for now
    this.originX = 'left';
    this.originY = 'bottom';
    this.name = WorldOriginUtil.UUID;
    this.perPixelTargetFind = true;
  }

  // Override the default Fabric.js rendering method to customize rendering behavior if needed
  public override _render(ctx: CanvasRenderingContext2D): void {
    // Custom rendering code can go here if needed
    console.log('Custom rendering logic');

    super._render(ctx);
  }
}

export class WorldOriginUtil {
  static UUID = '63b7caee-c041-4092-bef9-4557cf9ee479##WorldOrigin';

  static toObjectPositionX(viewportX: number, worldOriginX: number): number {
    return viewportX - worldOriginX;
  }

  static toObjectPositionY(viewportY: number, worldOriginY: number): number {
    return worldOriginY - viewportY; // This is the same as -(viewportY - worldOriginY)
  }

  static toViewportPositionX(objectX: number, worldOriginX: number): number {
    return objectX + worldOriginX;
  }

  static toViewportPositionY(objectY: number, worldOriginY: number): number {
    return worldOriginY - objectY; // This is the same as -(objectY - worldOriginY)
  }
}
