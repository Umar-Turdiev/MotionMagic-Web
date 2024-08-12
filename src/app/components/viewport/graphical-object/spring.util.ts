import { fabric } from 'fabric';

export interface SpringOptions extends fabric.IObjectOptions {
  startPoint: fabric.Point;
  endPoint: fabric.Point;
  numCoils: number;
  coilRadius: number;
}

export class Spring extends fabric.Object {
  startPoint: fabric.Point;
  endPoint: fabric.Point;
  numCoils: number;
  coilRadius: number;

  constructor(options: SpringOptions) {
    super(options);
    this.startPoint = options.startPoint;
    this.endPoint = options.endPoint;
    this.numCoils = options.numCoils || 5;
    this.coilRadius = options.coilRadius || 60;

    this.calculateDimensions();
    // this.set({ selectable: true, hasControls: false }); // Allow interaction
  }

  calculateDimensions() {
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    const padding = 10;

    // this.width = Math.abs(this.endPoint.x - this.startPoint.x) + padding * 4;
    // this.height = Math.abs(this.endPoint.y - this.startPoint.y) + padding * 4;
    this.width = 1000;
    this.height = 1000;
    this.left = Math.min(this.startPoint.x, this.endPoint.x) - padding;
    this.top = Math.min(this.startPoint.y, this.endPoint.y) - padding;
  }

  override _render(ctx: CanvasRenderingContext2D) {
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const numPoints = 100; // Increase for smoother spring

    ctx.save();

    // Translate and rotate context to start point
    // ctx.translate(this.width! / 2, this.height! / 2);
    ctx.rotate(angle);

    // Adjust spring start position within bounding box
    const startX = 0;
    const startY = 0;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2878a6ff';

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * Math.PI * this.numCoils;
      const x = startX + (i / numPoints) * length;
      const y = this.coilRadius * Math.sin(t);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.restore();

    // draw rectangle
    // ctx.beginPath();
    // ctx.fillStyle = 'red';
    // ctx.fillRect(this.left!, this.top!, this.width!, this.height!);
    // ctx.fill();

    // Debugging log
    console.log('render spring', ctx.canvas.width, ctx.canvas.height);
  }
}

(fabric as any).Spring = fabric.util.createClass(Spring, {
  type: 'spring',
});

(fabric as any).Spring.fromObject = function (
  object: any,
  callback: (obj: fabric.Object) => any
) {
  return fabric.Object._fromObject('Spring', object, callback);
};
