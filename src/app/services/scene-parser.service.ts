import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Scene } from '../model/scene.model';

@Injectable({
  providedIn: 'root',
})
export class SceneParserService {
  constructor(private http: HttpClient) {}

  parseSceneJson(jsonUrl: string): Observable<Scene> {
    return this.http.get<Scene>(jsonUrl);
  }
}
