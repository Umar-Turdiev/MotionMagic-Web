export enum PenType {
  Eraser = 'eraser',
  Pen = 'pen',
  Highlighter = 'highlighter',
  LaserPointer = 'laserPointer',
}

export class PenProperties {
  constructor(
    public color: string = '#FFFFFF',
    public thickness: number = 3,
    public opacity: number = 100,
    public type: PenType = PenType.Pen, // If this is set to eraser, all the other properties will be ignored
    public squareLineCap: boolean = false,
    public glow: boolean = false,
  ) {}
}
