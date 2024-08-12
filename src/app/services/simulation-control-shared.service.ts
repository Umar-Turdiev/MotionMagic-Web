import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SimulationControlSharedService {
  private isRunning: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private restartSignal: ReplaySubject<void> = new ReplaySubject<void>(1);

  constructor() {
    this.isRunning.next(false);
  }

  getIsRunning$(): Observable<boolean> {
    return this.isRunning.asObservable();
  }

  setIsRunning(data: boolean): void {
    this.isRunning.next(data);
  }

  getRestartSignal$(): Observable<void> {
    return this.restartSignal.asObservable();
  }

  sendRestartSignal(): void {
    this.restartSignal.next();
  }
}
