import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { initializeApp } from 'firebase/app';
import {
  getVertexAI,
  getGenerativeModel,
  GenerativeModel,
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  HarmBlockMethod,
} from 'firebase/vertexai-preview';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private firebaseApp: any;
  private vertexAI: VertexAI;
  private model: GenerativeModel;
  private isStopped: boolean = false;

  constructor() {
    this.firebaseApp = initializeApp(environment.firebaseConfig);
    this.vertexAI = getVertexAI(this.firebaseApp);
    this.model = getGenerativeModel(this.vertexAI, {
      model: 'gemini-1.5-pro',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          method: HarmBlockMethod.SEVERITY,
        },
      ],
    });
    this.model.generationConfig = {
      responseMimeType: 'application/json',
      temperature: 0.3,
    };
  }

  async fileToGenerativePart(file: File): Promise<any> {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result!.toString().split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  async *generateContentStream(
    prompt: string,
    files: File[] = []
  ): AsyncIterable<string> {
    this.isStopped = false; // Reset the stopped flag

    const parts = [prompt];
    const filePromises = files.map((file) => this.fileToGenerativePart(file));
    const imageParts = await Promise.all(filePromises);
    parts.push(...imageParts);

    const result = await this.model.generateContentStream(parts);

    for await (const chunk of result.stream) {
      if (this.isStopped) {
        console.log('Generation stopped by user.');
        break;
      }
      yield chunk.text();
    }
  }

  stop() {
    this.isStopped = true;
  }
}
