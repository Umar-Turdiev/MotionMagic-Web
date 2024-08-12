import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ObjectActionsSharedService {
    private selectAllSignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private copySignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private cutSignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private pasteSignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private deleteSignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private undoSignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private redoSignal: ReplaySubject<void> = new ReplaySubject<void>(1);
    private developerTestHotKeySignal: ReplaySubject<void> = new ReplaySubject<void>(1);

    getSelectAllSignal$(): Observable<void> {
        return this.selectAllSignal.asObservable();
    }

    sendSelectAllSignal(): void {
        this.selectAllSignal.next();
    }

    getCopySignal$(): Observable<void> {
        return this.copySignal.asObservable();
    }
    
    sendCopySignal(): void {
        this.copySignal.next();
    }

    getCutSignal$(): Observable<void> {
        return this.cutSignal.asObservable();
    }

    sendCutSignal(): void {
        this.cutSignal.next();
    }

    getPasteSignal$(): Observable<void> {
        return this.pasteSignal.asObservable();
    }

    sendPasteSignal(): void {
        this.pasteSignal.next();
    }
    
    sendDuplicateSignal(): void {
        this.copySignal.next();
        this.pasteSignal.next();
    }

    getDeleteSignal$(): Observable<void> {
        return this.deleteSignal.asObservable();
    }

    sendDeleteSignal(): void {
        this.deleteSignal.next();
    }

    getUndoSignal$(): Observable<void> {
        return this.undoSignal.asObservable();
    }

    sendUndoSignal(): void {
        this.undoSignal.next();
    }

    getRedoSignal$(): Observable<void> {
        return this.redoSignal.asObservable();
    }

    sendRedoSignal(): void {
        this.redoSignal.next();
    }

    getDeveloperTestHotKeySignal$(): Observable<void> {
        return this.developerTestHotKeySignal.asObservable();
    }

    sendDeveloperTestHotKeySignal(): void {
        this.developerTestHotKeySignal.next();
    }
}