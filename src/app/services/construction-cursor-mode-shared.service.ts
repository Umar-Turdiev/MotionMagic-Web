import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

import { ConstructionCursorMode } from '../model/construction-cursor-mode.model';

@Injectable({
  providedIn: 'root',
})
export class ConstructionCursorModeSharedService {
  private currentMode: ReplaySubject<ConstructionCursorMode> =
    new ReplaySubject<ConstructionCursorMode>(1);

  getCurrentMode$(): Observable<ConstructionCursorMode> {
    return this.currentMode.asObservable();
  }

  setCurrentMode(data: ConstructionCursorMode): void {
    this.currentMode.next(data);
  }
}
