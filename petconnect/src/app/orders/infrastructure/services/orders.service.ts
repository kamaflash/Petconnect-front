import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, pageParams } from '../../../shared/infrastructure/http/page-response';

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: string;
  sellerId: string;
  buyerId: string;
  status: string;
  totalAmount: number;
  shippingAddress: string | null;
  paymentMethod: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  sellerId: string;
  buyerId: string;
  items: {
    productId: string;
    productName: string;
    productImageUrl?: string;
    unitPrice: number;
    quantity: number;
  }[];
  shippingAddress: string;
  paymentMethod: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Crear un nuevo pedido (cliente compra a un vendedor) */
  createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${this.apiUrl}/order-management/orders`,
      request
    );
  }

  /** Listar todos los pedidos de mi tienda (solo vendedor) */
  getMyOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(
      `${this.apiUrl}/order-management/orders/seller`
    );
  }

  /** Obtener detalle de un pedido (solo vendedor dueño) */
  getOrderDetail(orderId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(
      `${this.apiUrl}/order-management/orders/${orderId}`
    );
  }

  /** Actualizar el estado de un pedido (solo vendedor dueño) */
  updateOrderStatus(orderId: string, status: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(
      `${this.apiUrl}/order-management/orders/${orderId}/status`,
      { status }
    );
  }
}