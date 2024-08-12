import { fabric } from 'fabric';

export as namespace fabric;

// Extend the IAnimationOptions interface to include the abort option
declare module 'fabric' {
  export interface IAnimationOptions {
    abort?: () => boolean | undefined;
  }

  class Spring extends fabric.Object {
    startPoint: fabric.Point;
    endPoint: fabric.Point;
    numCoils: number;
    coilRadius: number;

    constructor(options: SpringOptions);
  }

  interface SpringOptions extends fabric.IObjectOptions {
    startPoint: fabric.Point;
    endPoint: fabric.Point;
    numCoils: number;
    coilRadius: number;
  }
}
