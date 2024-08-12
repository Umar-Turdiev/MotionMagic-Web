import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

import { ViewportMode } from '../model/viewport-mode.model';

@Injectable({
  providedIn: 'root',
})
export class ViewportModeSharedService {
  private currentMode: ReplaySubject<ViewportMode> =
    new ReplaySubject<ViewportMode>(1);

  getCurrentMode$(): Observable<ViewportMode> {
    return this.currentMode.asObservable();
  }

  setCurrentMode(data: ViewportMode): void {
    this.currentMode.next(data);
  }
}
