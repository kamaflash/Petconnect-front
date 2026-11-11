import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InvoiceResponse {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateInvoiceRequest {
  orderId: string;
  taxAmount?: number;
}

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Generar una factura para una orden (solo vendedor dueño) */
  generateInvoice(request: GenerateInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(
      `${this.apiUrl}/invoice-management/invoices`,
      request
    );
  }

  /** Listar todas las facturas de mi tienda (solo vendedor) */
  getMyInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(
      `${this.apiUrl}/invoice-management/invoices/seller`
    );
  }
}