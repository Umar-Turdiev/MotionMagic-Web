import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ViewportTransformSharedService {
    private viewportTransformSignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private zoomPercentage: ReplaySubject<number> = new ReplaySubject<number>(1);
    private adjustZoomPercentageSignal: ReplaySubject<number> = new ReplaySubject<number>(1);

    getViewportTransformSignal$(): Observable<void> {
        return this.viewportTransformSignal.asObservable();
    }

    sendViewportTransfromSignal(): void {
        this.viewportTransformSignal.next();
    }

    getZoomPercentage$(): Observable<number> {
        return this.zoomPercentage.asObservable();
    }

    setZoomPercentage(value: number): void {
        this.zoomPercentage.next(value);
    }

    getAdjustZoomPercentageSignal$(): Observable<number> {
        return this.adjustZoomPercentageSignal.asObservable();
    }
    
    sendAdjustZoomPercentageSignal(value: number): void {
        this.adjustZoomPercentageSignal.next(value);
    }
}