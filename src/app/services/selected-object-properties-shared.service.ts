import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectedObjectPropertiesSharedService {
  private selectedObjectIds = new ReplaySubject<string[]>(1);
  private propertyChangedSignal: ReplaySubject<void> = new ReplaySubject<void>(
    1,
  );
  private selectedObjectsCenterPosition: { x: number, y: number } = { x: 0, y: 0 };

  public getSelectedObjectId$(): Observable<string[]> {
    return this.selectedObjectIds.asObservable();
  }

  public setSelectedObjectId(data: string[]): void {
    this.selectedObjectIds.next(data);
  }

  public getPropertyChangedSignal$(): Observable<void> {
    return this.propertyChangedSignal.asObservable();
  }

  public sendPropertyChangedSignal(): void {
    this.propertyChangedSignal.next();
  }

  public setSelectedObjectsCenterPosition(value: { x: number, y: number }): void {
    this.selectedObjectsCenterPosition = value;
  }

  public getSelectedObjectsCenterPosition(): { x: number, y: number } {
    return this.selectedObjectsCenterPosition;
  }
}
