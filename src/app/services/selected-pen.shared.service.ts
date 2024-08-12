import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

import { PenProperties } from '../model/pen.model';

@Injectable({
  providedIn: 'root',
})
export class SelectedPenSharedService {
  private penProperties: ReplaySubject<PenProperties> =
    new ReplaySubject<PenProperties>(1);

  getPenProperties$(): Observable<PenProperties> {
    return this.penProperties.asObservable();
  }

  setPenProperties(data: PenProperties): void {
    this.penProperties.next(data);
  }
}
