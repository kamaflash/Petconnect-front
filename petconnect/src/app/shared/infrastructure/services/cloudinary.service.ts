import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Sube un archivo a Cloudinary a través del backend
   */
  uploadImage(file: File): Observable<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<CloudinaryUploadResponse>(`${this.apiUrl}/cloudinary/upload`, formData);
  }

  /**
   * Sube múltiples archivos a Cloudinary
   */
  async uploadMultipleImages(files: File[]): Promise<CloudinaryUploadResponse[]> {
    const results: CloudinaryUploadResponse[] = [];
    for (const file of files) {
      const response = await this.http.post<CloudinaryUploadResponse>(
        `${this.apiUrl}/cloudinary/upload`,
        this.createFormData(file)
      ).toPromise();
      if (response) {
        results.push(response);
      }
    }
    return results;
  }

  private createFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  }
}
