import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewportEventSharedService {
  private beforeClickSignal: ReplaySubject<void> = new ReplaySubject<void>(1);

  public getBeforeClickSignal$(): Observable<void> {
    return this.beforeClickSignal.asObservable();
  }

  public sendBeforeClickSignal(): void {
    this.beforeClickSignal.next();
  }
}
