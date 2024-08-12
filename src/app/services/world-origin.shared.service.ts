import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

import { Vector2D } from '../model/scene.model';

@Injectable({
  providedIn: 'root',
})
export class WorldOriginSharedService {
  private position: ReplaySubject<Vector2D> = new ReplaySubject<Vector2D>(1);
  private worldOrigin: Vector2D = { x: -183.461, y: 99.692 };

  constructor() {
    this.position.next(this.worldOrigin);
  }

  public getWorldOrigin$(): Observable<Vector2D> {
    return this.position.asObservable();
  }

  public setWorldOrigin(value: Vector2D): void {
    this.worldOrigin = value;
    this.position.next(value);
  }

  public getWorldOrigin(): Vector2D {
    return this.worldOrigin;
  }
}
