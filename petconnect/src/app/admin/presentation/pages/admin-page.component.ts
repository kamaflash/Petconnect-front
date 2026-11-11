import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableCardComponent, TableCardItem } from '../../../shared/presentation/components/table-card/table-card.component';
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { MarketplaceService, CreateProductRequest, ProductResponse } from '../../../marketplace/infrastructure/services/marketplace.service';
import { AdoptionService, AdoptionRequest, AdoptionStatus } from '../../../adoptions/infrastructure/services/adoption.service';
import { OrdersService, OrderResponse, CreateOrderRequest, UpdateOrderStatusRequest } from '../../../orders/infrastructure/services/orders.service';
import { InvoicesService, InvoiceResponse, GenerateInvoiceRequest } from '../../../invoices/infrastructure/services/invoices.service';
import { PageResponse } from '../../../shared/infrastructure/http/page-response';
import { ProfileService, UserProfileResponse } from '../../../profile/infrastructure/services/profile.service';
import { PetOwnershipEventService } from '../../../shared/services/pet-ownership-event.service';
import { PetService } from '../../../pets/infrastructure/services/pet.service';
import { PetResponse } from '../../../pets/domain/pet.model';
import {
  ShelterManagementService,
  ShelterVisitRequest,
  ShelterVisitStatus
} from '../../../shelter/infrastructure/services/shelter-management.service';

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  active: boolean;
  rating?: number;
  reviews?: number;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    ProgressBarModule,
    TagModule,
    DialogModule,
    ToastModule,
    TableCardComponent,
    TabsComponent,
    DynamicFormComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="admin-page">
      <div class="admin-container">
        <!-- Header -->
        <header class="admin-header page-heading-card">
          <div class="page-heading-copy">
            <h1>{{ 'admin.dashboardTitle' | transloco }}</h1>
            <p class="welcome-text">{{ dashboardSubtitleKey() | transloco }}</p>
          </div>
        </header>

        <!-- Tabs -->
        <app-tabs
          [tabs]="adminTabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />

        <!-- Loading indicator -->
        <div class="loading-overlay" *ngIf="loading()">
          <p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar>
        </div>

        <!-- Contenido de tabs -->
        <div class="admin-content">
          <!-- Servicios ofrecidos (Vet) -->
          <div class="admin-section" *ngIf="activeTab() === 'services' && hasProfile('vet')">
            <div class="section-header">
              <h2>{{ 'admin.tabs.services' | transloco }}</h2>
            </div>
            <p class="section-subtitle">{{ 'admin.servicesSettingsDescription' | transloco }}</p>
            <p-button
              [label]="'admin.editProfessionalProfile' | transloco"
              icon="pi pi-user-edit"
              (onClick)="editProfessionalProfile()"
            />
          </div>

          <!-- Perfil profesional (Trainer) -->
          <div class="admin-section" *ngIf="activeTab() === 'professional-profile' && hasProfile('trainer')">
            <div class="section-header">
              <h2>{{ 'admin.tabs.professionalProfile' | transloco }}</h2>
            </div>
            <p class="section-subtitle">{{ 'admin.trainerProfileDescription' | transloco }}</p>
            <p-button
              [label]="'admin.editProfessionalProfile' | transloco"
              icon="pi pi-user-edit"
              (onClick)="editProfessionalProfile()"
            />
          </div>

          <!-- Productos (Seller) -->
          <div class="admin-section" *ngIf="activeTab() === 'products' && hasProfile('seller')">
            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreateProductForm()">
              <app-dynamic-form
                [config]="productFormConfig"
                [(formData)]="productFormData"
                (onSubmitClick)="handleCreateProduct($event)"
                (onCancel)="showCreateProductForm.set(false)"
              />
            </div>

            <!-- Lista de productos -->
            <div *ngIf="!showCreateProductForm()">
              <app-table-card
                [type]="'product'"
                [items]="adminProductItems()"
                [showSearch]="true"
                [filteredItems]="adminProductItems()"
                [editable]="true"
                [loading]="loading()"
                (onAdd)="showCreateProductForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteProductById(item.id)" />
                </ng-template>
              </app-table-card>
            </div>
          </div>

          <!-- Pedidos (Seller) -->
          <div class="admin-section" *ngIf="activeTab() === 'orders' && hasProfile('seller')">
            <div class="section-header">
              <h2>{{ 'admin.tabs.orders' | transloco }}</h2>
              <p-button [label]="'admin.refreshOrders' | transloco" icon="pi pi-refresh" styleClass="p-button-sm p-button-secondary" (onClick)="loadMyOrders()" />
            </div>
            <p class="section-subtitle">{{ 'admin.ordersSubtitle' | transloco }}</p>
            <div class="adoptions-empty" *ngIf="ordersLoading() && adminOrders().length === 0"><p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar></div>
            <div class="adoptions-empty" *ngIf="!ordersLoading() && adminOrders().length === 0"><i class="pi pi-shopping-cart"></i><p>{{ 'admin.noOrders' | transloco }}</p><span class="empty-subtitle">{{ 'admin.noOrdersSubtitle' | transloco }}</span></div>
            <div class="orders-list" *ngIf="!ordersLoading() && adminOrders().length > 0">
              <div class="order-card" *ngFor="let order of adminOrders()">
                <div class="order-header">
                  <div class="order-info"><span class="order-id">Pedido #{{ order.id.substring(0, 8) }}</span><p-tag [value]="order.status" [severity]="orderStatusSeverity(order.status)"></p-tag></div>
                  <div class="order-total"><span>{{ order.totalAmount | currency:'EUR' }}</span></div>
                </div>
                <div class="order-body">
                  <div class="order-customer"><i class="pi pi-user"></i><span>{{ 'admin.orderBuyer' | transloco }}: {{ order.buyerId.substring(0, 8) }}</span></div>
                  <div class="order-date"><i class="pi pi-calendar"></i><span>{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
                  <div class="order-items"><span>{{ 'admin.orderItems' | transloco }}: {{ order.items.length }}</span><div class="order-items-preview"><span *ngFor="let item of order.items.slice(0, 3)">{{ item.productName }} ×{{ item.quantity }}</span><span *ngIf="order.items.length > 3" class="more-items">+{{ order.items.length - 3 }} más</span></div></div>
                </div>
                <div class="order-actions">
                  <p-button [label]="'admin.viewDetails' | transloco" icon="pi pi-eye" styleClass="p-button-sm p-button-secondary" (onClick)="selectOrder(order.id)" />
                  <p-button *ngIf="order.status === 'PENDING' || order.status === 'PAID'" [label]="'admin.markAsPreparing' | transloco" icon="pi pi-clock" styleClass="p-button-sm p-button-info" (onClick)="updateOrderStatus(order.id, 'PREPARING')" />
                  <p-button *ngIf="order.status === 'PREPARING'" [label]="'admin.markAsShipped' | transloco" icon="pi pi-truck" styleClass="p-button-sm p-button-success" (onClick)="updateOrderStatus(order.id, 'SHIPPED')" />
                  <p-button *ngIf="order.status === 'SHIPPED'" [label]="'admin.markAsDelivered' | transloco" icon="pi pi-check-circle" styleClass="p-button-sm p-button-success" (onClick)="updateOrderStatus(order.id, 'DELIVERED')" />
                </div>
              </div>
            </div>
          </div>

          <!-- Facturas (Seller) -->
          <div class="admin-section" *ngIf="activeTab() === 'invoices' && hasProfile('seller')">
            <div class="section-header">
              <h2>{{ 'admin.tabs.invoices' | transloco }}</h2>
              <p-button [label]="'admin.refreshInvoices' | transloco" icon="pi pi-refresh" styleClass="p-button-sm p-button-secondary" (onClick)="loadMyInvoices()" />
            </div>
            <p class="section-subtitle">{{ 'admin.invoicesSubtitle' | transloco }}</p>
            <div class="adoptions-empty" *ngIf="invoicesLoading() && adminInvoices().length === 0"><p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar></div>
            <div class="adoptions-empty" *ngIf="!invoicesLoading() && adminInvoices().length === 0"><i class="pi pi-file"></i><p>{{ 'admin.noInvoices' | transloco }}</p><span class="empty-subtitle">{{ 'admin.noInvoicesSubtitle' | transloco }}</span></div>
            <div class="invoices-list" *ngIf="!invoicesLoading() && adminInvoices().length > 0">
              <div class="invoice-card" *ngFor="let invoice of adminInvoices()">
                <div class="invoice-header">
                  <div class="invoice-info"><span class="invoice-number">Factura {{ invoice.invoiceNumber }}</span><p-tag [value]="invoice.status" severity="info"></p-tag></div>
                  <div class="invoice-total"><span>{{ invoice.totalAmount | currency:'EUR' }}</span></div>
                </div>
                <div class="invoice-body">
                  <div class="invoice-date"><i class="pi pi-calendar"></i><span>{{ 'admin.invoiceDate' | transloco }}: {{ invoice.issueDate | date:'dd/MM/yyyy' }}</span></div>
                  <div class="invoice-order"><i class="pi pi-shopping-cart"></i><span>{{ 'admin.invoiceOrder' | transloco }}: #{{ invoice.orderId.substring(0, 8) }}</span></div>
                </div>
                <div class="invoice-actions">
                  <p-button *ngIf="!invoice.pdfUrl" [label]="'admin.generateInvoice' | transloco" icon="pi pi-download" styleClass="p-button-sm p-button-success" (onClick)="prepareGenerateInvoice(invoice.orderId)" />
                  <p-button *ngIf="invoice.pdfUrl" [label]="'admin.downloadInvoice' | transloco" icon="pi pi-download" styleClass="p-button-sm p-button-secondary" (onClick)="downloadInvoice(invoice.pdfUrl)" />
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen de protectora -->
          <div class="admin-section" *ngIf="activeTab() === 'shelter-overview' && hasProfile('shelter')">
            <div class="section-header">
              <div>
                <h2>{{ 'admin.shelterOverviewTitle' | transloco }}</h2>
                <p class="section-subtitle">{{ 'admin.shelterOverviewSubtitle' | transloco }}</p>
              </div>
            </div>

            <div class="shelter-stats-grid">
              <article class="shelter-stat-card">
                <span class="shelter-stat-icon"><i class="pi pi-paw"></i></span>
                <span class="shelter-stat-value">{{ shelterPets().length }}</span>
                <span class="shelter-stat-label">{{ 'admin.shelterAnimals' | transloco }}</span>
              </article>
              <article class="shelter-stat-card">
                <span class="shelter-stat-icon"><i class="pi pi-heart"></i></span>
                <span class="shelter-stat-value">{{ adoptableShelterPets().length }}</span>
                <span class="shelter-stat-label">{{ 'admin.shelterAnimalsForAdoption' | transloco }}</span>
              </article>
            </div>

          </div>

          <!-- Solicitudes de adopción recibidas -->
          <div class="admin-section" *ngIf="activeTab() === 'adoptions'">
            <div class="section-header">
              <h2>{{ 'admin.adoptionRequests' | transloco }}</h2>
            </div>

            <div class="adoptions-empty" *ngIf="adminAdoptions().length === 0">
              <i class="pi pi-heart"></i>
              <p>{{ 'admin.noAdoptionRequests' | transloco }}</p>
              <span class="empty-subtitle">{{ 'admin.noAdoptionRequestsSubtitle' | transloco }}</span>
            </div>

            <div class="adoptions-list" *ngIf="adminAdoptions().length > 0">
              <div class="adoption-request-card" *ngFor="let req of adminAdoptions()">
                <div class="adoption-request-main">
                  <p-avatar [image]="req.petImage || 'https://placehold.co/150'" shape="circle" size="large"></p-avatar>
                  <div class="adoption-request-info">
                    <div class="adoption-request-title">
                      <strong>{{ req.adopterName }}</strong>
                      <p-tag
                        [value]="adoptionStatusLabel(req.status)"
                        [severity]="adoptionStatusSeverity(req.status)"
                        styleClass="adoption-status-tag"
                      ></p-tag>
                    </div>
                    <div class="adoption-request-pet">
                      <i class="pi pi-paw"></i>
                      <span>{{ req.petName }} · {{ req.species || ('admin.unknownSpecies' | transloco) }} {{ req.breed ? '· ' + req.breed : '' }}</span>
                    </div>
                    <div class="adoption-request-message" *ngIf="req.message">
                      "{{ req.message }}"
                    </div>
                    <div class="adoption-steps" *ngIf="stageIndexOf(req.status) >= 0">
                      <div
                        class="adoption-step"
                        *ngFor="let stage of adoptionStages; let i = index"
                        [class.active]="i < stageIndexOf(req.status)"
                        [class.current]="i === stageIndexOf(req.status)"
                      >
                        <span class="adoption-step-dot"></span>
                        <span class="adoption-step-label">{{ adoptionStageShortLabel(stage) }}</span>
                      </div>
                      <span class="adoption-step-counter" *ngIf="req.status === 'completed'">✓ {{ 'admin.completed' | transloco }}</span>
                      <span class="adoption-step-counter" *ngIf="req.status !== 'completed'">
                        {{ 'admin.stageOf' | transloco:{ current: stageIndexOf(req.status) + 1, total: adoptionStages.length } }}
                      </span>
                    </div>
                    <div class="adoption-request-date">
                      {{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                </div>
                <div class="adoption-request-actions">
                  <p-button
                    *ngIf="canAdvance(req.status)"
                    label="{{ 'admin.advanceStage' | transloco }}"
                    icon="pi pi-arrow-right"
                    styleClass="p-button-sm p-button-success"
                    (onClick)="advanceAdoption(req)"
                  />
                  <p-button
                    label="{{ 'admin.contactAdopter' | transloco }}"
                    icon="pi pi-send"
                    styleClass="p-button-sm p-button-secondary"
                    (onClick)="contactAdopter(req)"
                  />
                  <p-button
                    *ngIf="canReject(req.status)"
                    label="{{ 'admin.reject' | transloco }}"
                    icon="pi pi-times"
                    styleClass="p-button-sm p-button-danger p-button-outlined"
                    (onClick)="rejectAdoption(req)"
                  />
                </div>
              </div>
            </div>

          </div>

          <!-- Enlace de donación de la protectora -->
          <div class="admin-section" *ngIf="activeTab() === 'donations' && hasProfile('shelter')">
            <div class="section-header">
              <div>
                <h2>{{ 'admin.shelterDonationLink' | transloco }}</h2>
                <p class="section-subtitle">{{ 'admin.shelterDonationLinkDescription' | transloco }}</p>
              </div>
            </div>

            <form class="shelter-form" (ngSubmit)="saveDonationLink()">
              <label>
                {{ 'admin.donationLink' | transloco }}
                <input name="donationUrl" type="url" maxlength="2048" placeholder="https://" [(ngModel)]="donationUrl" />
              </label>
              <div class="shelter-form-actions">
                <p-button type="submit" [label]="'common.save' | transloco" icon="pi pi-check" [disabled]="donationLinkSaving()" />
                <p-button
                  *ngIf="donationUrl"
                  type="button"
                  [label]="'admin.removeDonationLink' | transloco"
                  icon="pi pi-trash"
                  severity="secondary"
                  [outlined]="true"
                  [disabled]="donationLinkSaving()"
                  (onClick)="clearDonationLink()"
                />
              </div>
            </form>
            <div class="shelter-management-card" *ngIf="donationUrl">
              <i class="pi pi-heart-fill" aria-hidden="true"></i>
              <div class="shelter-management-card-copy">
                <p>{{ 'admin.currentDonationLink' | transloco }}</p>
                <a [href]="donationUrl" target="_blank" rel="noopener noreferrer">{{ donationUrl }}</a>
              </div>
            </div>
          </div>

          <!-- Visitas a la protectora -->
          <div class="admin-section" *ngIf="activeTab() === 'shelter-visits' && hasProfile('shelter')">
            <div class="section-header">
              <div>
                <h2>{{ 'admin.shelterVisits' | transloco }}</h2>
                <p class="section-subtitle">{{ 'admin.shelterVisitsDescription' | transloco }}</p>
              </div>
            </div>
            <div class="adoptions-empty" *ngIf="!shelterVisitRequests().length">
              <i class="pi pi-calendar"></i>
              <p>{{ 'admin.noShelterVisits' | transloco }}</p>
            </div>
            <div class="shelter-management-list" *ngIf="shelterVisitRequests().length">
              <article class="shelter-management-card visit-request-card" *ngFor="let visit of shelterVisitRequests()">
                <div class="shelter-management-card-copy">
                  <div class="adoption-request-title">
                    <strong>{{ visit.visitorName }}</strong>
                    <p-tag [value]="visitStatusLabel(visit.status)" [severity]="visitStatusSeverity(visit.status)" />
                  </div>
                  <p><i class="pi pi-calendar"></i> {{ visit.visitAt | date:'dd/MM/yyyy HH:mm' }} · {{ 'admin.visitorCount' | transloco:{ count: visit.partySize } }}</p>
                  <p *ngIf="visit.message">{{ visit.message }}</p>
                  <p class="visit-response-note" *ngIf="visit.responseNote">{{ visit.responseNote }}</p>
                  <div class="visit-alternative-form" *ngIf="alternativeVisitId() === visit.id">
                    <label>
                      {{ 'admin.alternativeVisitDate' | transloco }}
                      <input type="datetime-local" [(ngModel)]="alternativeVisitDate" [ngModelOptions]="{standalone: true}" />
                    </label>
                    <div class="shelter-form-actions">
                      <p-button [label]="'admin.proposeVisitTime' | transloco" icon="pi pi-send" (onClick)="proposeVisitTime(visit)" />
                      <p-button [label]="'common.cancel' | transloco" severity="secondary" [outlined]="true" (onClick)="alternativeVisitId.set(null)" />
                    </div>
                  </div>
                </div>
                <div class="shelter-form-actions" *ngIf="visit.status === 'PENDING'">
                  <p-button [label]="'admin.confirmVisit' | transloco" icon="pi pi-check" severity="success" (onClick)="updateVisitStatus(visit, 'CONFIRMED')" />
                  <p-button [label]="'admin.proposeAnotherTime' | transloco" icon="pi pi-clock" severity="secondary" [outlined]="true" (onClick)="openAlternativeVisit(visit)" />
                  <p-button [label]="'admin.reject' | transloco" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="updateVisitStatus(visit, 'REJECTED')" />
                </div>
                <div class="shelter-form-actions" *ngIf="visit.status === 'CONFIRMED' || visit.status === 'ALTERNATIVE_PROPOSED'">
                  <p-button *ngIf="visit.status === 'CONFIRMED'" [label]="'admin.markVisitCompleted' | transloco" icon="pi pi-check-circle" severity="success" [outlined]="true" (onClick)="updateVisitStatus(visit, 'COMPLETED')" />
                  <p-button [label]="'admin.proposeAnotherTime' | transloco" icon="pi pi-clock" severity="secondary" [outlined]="true" (onClick)="openAlternativeVisit(visit)" />
                </div>
              </article>
            </div>
          </div>

          <!-- Solicitudes de cambio de tipo de perfil (solo admin) -->
          <div class="admin-section" *ngIf="activeTab() === 'type-requests' && isAdmin()">
            <div class="section-header">
              <h2>{{ 'admin.typeRequestsTitle' | transloco }}</h2>
              <p-button
                label="{{ 'admin.refresh' | transloco }}"
                icon="pi pi-refresh"
                styleClass="p-button-sm p-button-secondary"
                (onClick)="loadTypeRequests()"
              />
            </div>
            <p class="section-subtitle">{{ 'admin.typeRequestsSubtitle' | transloco }}</p>

            <div class="adoptions-empty" *ngIf="typeRequests().length === 0">
              <i class="pi pi-check-circle"></i>
              <p>{{ 'admin.noTypeRequests' | transloco }}</p>
              <span class="empty-subtitle">{{ 'admin.noTypeRequestsSubtitle' | transloco }}</span>
            </div>

            <div class="adoptions-list" *ngIf="typeRequests().length > 0">
              <div class="adoption-request-card" *ngFor="let req of typeRequests()">
                <div class="adoption-request-main">
                  <p-avatar [image]="req.avatarUrl || 'https://placehold.co/150'" shape="circle" size="large"></p-avatar>
                  <div class="adoption-request-info">
                    <div class="adoption-request-title">
                      <strong>{{ req.firstName }} {{ req.lastName }}</strong>
                      <p-tag
                        [value]="typeRequestLabel(req.pendingProfileType)"
                        severity="warn"
                        styleClass="adoption-status-tag"
                      ></p-tag>
                    </div>
                    <div class="adoption-request-pet">
                      <i class="pi pi-id-card"></i>
                      <span>{{ 'admin.typeRequestCurrent' | transloco }}: {{ typeRequestLabel(req.profileType) }}</span>
                    </div>
                    <div class="adoption-request-message" *ngIf="typeRequestDetail(req)">
                      {{ typeRequestDetail(req) }}
                    </div>
                  </div>
                </div>
                <div class="adoption-request-actions">
                  <p-button
                    label="{{ 'admin.approve' | transloco }}"
                    icon="pi pi-check"
                    styleClass="p-button-sm p-button-success"
                    (onClick)="approveTypeRequest(req)"
                  />
                  <p-button
                    label="{{ 'admin.reject' | transloco }}"
                    icon="pi pi-times"
                    styleClass="p-button-sm p-button-danger p-button-outlined"
                    (onClick)="rejectTypeRequest(req)"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: 100vh;
      background-color: var(--surface-bg);
      transition: background-color 0.3s ease;
    }

    .admin-container {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 1rem;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    :host ::ng-deep .loading-overlay .p-progressbar {
      height: 4px;
    }

    :host ::ng-deep .loading-overlay .p-progressbar-value {
      background: var(--primary-color);
    }

    .admin-section {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0;
    }

    .section-subtitle {
      margin: 0 0 1rem;
      color: var(--bitbucket-text-secondary);
      font-size: 0.9rem;
    }

    .shelter-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      margin: 1rem 0 1.5rem;
    }

    .shelter-stat-card,
    .shelter-action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.75rem;
      background: var(--surface-card);
    }

    .shelter-stat-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35rem;
    }

    .shelter-stat-icon,
    .shelter-action-icon {
      display: grid;
      width: 2.5rem;
      height: 2.5rem;
      place-items: center;
      border-radius: 0.75rem;
      color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card));
    }

    .shelter-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
    }

    .shelter-stat-label {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
    }

    .form-container {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
    }

    /* Adopciones */
    .adoptions-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--bitbucket-text-secondary);
    }

    .adoptions-empty i {
      font-size: 2.5rem;
      opacity: 0.4;
      margin-bottom: 0.75rem;
    }

    .adoptions-empty p {
      margin: 0 0 0.25rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
    }

    .adoptions-empty .empty-subtitle {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    .adoptions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .adoption-request-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.5rem;
      background-color: var(--bitbucket-header-bg);
    }

    .adoption-request-main {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex: 1;
      min-width: 0;
    }

    .adoption-request-info {
      flex: 1;
      min-width: 0;
    }

    .adoption-request-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .adoption-request-title strong {
      font-size: 1rem;
      color: var(--bitbucket-text-primary);
    }

    .adoption-request-pet {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .adoption-request-message {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-style: italic;
      color: var(--bitbucket-text-primary);
      background-color: var(--bitbucket-body-bg);
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
    }

    .adoption-request-date {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
      opacity: 0.8;
    }

    .adoption-request-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      flex-shrink: 0;
      align-items: center;
      justify-content: flex-end;
    }

    .adoption-steps {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .adoption-step {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
      opacity: 0.5;
    }

    .adoption-step .adoption-step-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--bitbucket-border);
      flex-shrink: 0;
    }

    .adoption-step.active {
      opacity: 0.8;
    }

    .adoption-step.active .adoption-step-dot {
      background-color: var(--primary-color, #4f46e5);
    }

    .adoption-step.current .adoption-step-dot {
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
      background-color: var(--primary-color, #4f46e5);
    }

    .adoption-step.current {
      opacity: 1;
      color: var(--bitbucket-text-primary);
      font-weight: 600;
    }

    .adoption-step-counter {
      margin-left: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--bitbucket-text-secondary);
    }

    @media (max-width: 640px) {
      .adoption-request-card {
        flex-direction: column;
      }

      .adoption-request-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    /* Responsive */
    .shelter-form, .shelter-management-list {
      display: grid;
      gap: 1rem;
    }

    .shelter-form {
      max-width: 720px;
      margin: 1.25rem 0;
    }

    .shelter-form label {
      display: grid;
      gap: 0.4rem;
      color: var(--bitbucket-text-primary);
      font-weight: 600;
    }

    .shelter-form input:not([type="checkbox"]), .shelter-form textarea,
    .visit-alternative-form input {
      width: 100%;
      border: 1px solid var(--surface-border);
      border-radius: 0.65rem;
      padding: 0.75rem;
      color: var(--bitbucket-text-primary);
      background: var(--surface-card);
    }

    .shelter-checkbox {
      display: flex !important;
      align-items: center;
    }

    .shelter-management-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--surface-border);
      border-radius: 1rem;
      background: var(--surface-card);
    }

    .shelter-management-card > img {
      width: 110px;
      height: 90px;
      object-fit: cover;
      border-radius: 0.75rem;
    }

    .shelter-management-card-copy {
      flex: 1;
      min-width: 0;
    }

    .shelter-management-card-copy p {
      margin: 0.5rem 0;
    }

    .shelter-management-card-copy a {
      overflow-wrap: anywhere;
    }

    .shelter-form-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .visit-alternative-form {
      display: grid;
      gap: 0.75rem;
      max-width: 420px;
      margin-top: 1rem;
    }

    .visit-response-note {
      color: var(--bitbucket-text-secondary);
    }

    @media (max-width: 768px) {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .shelter-stats-grid {
        grid-template-columns: 1fr;
      }

      .shelter-management-card {
        flex-direction: column;
      }

      .shelter-management-card > img {
        width: 100%;
        height: 160px;
      }

    }
  `]
})
export class AdminPageComponent implements OnInit {
  readonly i18n = inject(TranslocoService);
  private readonly authService = inject(AuthService);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly adoptionService = inject(AdoptionService);
  private readonly petService = inject(PetService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly petOwnershipEvent = inject(PetOwnershipEventService);
  private readonly shelterManagementService = inject(ShelterManagementService);
  private readonly ordersService = inject(OrdersService);
  private readonly invoicesService = inject(InvoicesService);

  // Loading state
  loading = signal(true);

  // Tabs
  activeTab = signal('');

  adminAdoptions = signal<AdoptionRequest[]>([]);
  shelterPets = signal<PetResponse[]>([]);
  shelterVisitRequests = signal<ShelterVisitRequest[]>([]);
  alternativeVisitId = signal<string | null>(null);
  alternativeVisitDate = '';
  donationUrl = '';
  donationLinkSaving = signal(false);
  adoptableShelterPets = computed(() =>
    this.shelterPets().filter(pet => pet.availableForAdoption)
  );

  // Solicitudes de cambio de tipo de perfil pendientes (solo admin)
  typeRequests = signal<UserProfileResponse[]>([]);

  // Products data (for sellers)
  adminProducts = signal<ProductItem[]>([]);
  showCreateProductForm = signal(false);
  productFormData = signal<any>({});

  // Orders data (for sellers)
  adminOrders = signal<OrderResponse[]>([]);
  ordersLoading = signal(false);
  selectedOrderId = signal<string | null>(null);
  orderStatusOptions = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Pagado', value: 'PAID' },
    { label: 'Preparando', value: 'PREPARING' },
    { label: 'Enviado', value: 'SHIPPED' },
    { label: 'Entregado', value: 'DELIVERED' },
    { label: 'Cancelado', value: 'CANCELLED' }
  ];

  // Invoices data (for sellers)
  adminInvoices = signal<InvoiceResponse[]>([]);
  invoicesLoading = signal(false);
  showGenerateInvoiceDialog = signal(false);
  invoiceForOrderId = signal<string | null>(null);

  // Product form configuration (for sellers)
  productFormConfig: DynamicFormConfig = {
    title: this.i18n.translate('admin.createNewProduct'),
    submitLabel: this.i18n.translate('admin.createProduct'),
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: this.i18n.translate('admin.productName'),
        type: 'input',
        placeholder: this.i18n.translate('admin.productNamePlaceholder'),
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: this.i18n.translate('common.description'),
        type: 'textarea',
        placeholder: this.i18n.translate('admin.describeProduct'),
        rows: 3,
        validation: { required: true, maxLength: 500 }
      },
      {
        key: 'price',
        label: this.i18n.translate('admin.price'),
        type: 'input',
        placeholder: 'Ej: 29.99',
        validation: { required: true }
      },
      {
        key: 'stock',
        label: this.i18n.translate('admin.stock'),
        type: 'input',
        placeholder: this.i18n.translate('admin.stockPlaceholder'),
        validation: { required: true, min: 0 }
      },
      {
        key: 'category',
        label: this.i18n.translate('common.category'),
        type: 'select',
        placeholder: this.i18n.translate('common.selectCategory'),
        options: [
          { label: this.i18n.translate('admin.categoryFood'), value: 'food' },
          { label: this.i18n.translate('admin.categoryAccessories'), value: 'accessories' },
          { label: this.i18n.translate('admin.categoryMedicine'), value: 'medicine' },
          { label: this.i18n.translate('admin.categoryToys'), value: 'toys' },
          { label: this.i18n.translate('common.other'), value: 'other' }
        ],
        validation: { required: true }
      },
      {
        key: 'imageUrl',
        label: this.i18n.translate('common.image'),
        type: 'file',
        placeholder: this.i18n.translate('admin.selectImage'),
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: false
      }
    ]
  };

  // User info
  // User profile type
  userProfileType = computed(() => {
    const user = this.authService.user();
    return user?.profileType?.toLowerCase() || 'user';
  });

  // Solo los administradores gestionan solicitudes de cambio de tipo
  isAdmin = computed(() => this.authService.user()?.role === 'ADMIN');
  dashboardSubtitleKey = computed(() => {
    if (this.isAdmin()) {
      return 'admin.dashboardSubtitleAdmin';
    }

    switch (this.userProfileType()) {
      case 'shelter':
        return 'admin.dashboardSubtitleShelter';
      case 'seller':
        return 'admin.dashboardSubtitleSeller';
      case 'vet':
        return 'admin.dashboardSubtitleVet';
      case 'trainer':
        return 'admin.dashboardSubtitleTrainer';
      default:
        return 'admin.dashboardSubtitle';
    }
  });

  // Check if user has specific profile
  hasProfile = (profileType: string): boolean => {
    return this.userProfileType() === profileType.toLowerCase();
  };

  // Convert to TableCardItem format
  adminProductItems = computed((): TableCardItem[] => {
    return this.adminProducts().map(product => ({
      id: product.id,
      name: product.name,
      avatar: product.imageUrl || 'https://placehold.co/150',
      description: `${product.description || ''} | ${this.i18n.translate('admin.stock')}: ${product.stock} | ${this.i18n.translate('common.category')}: ${product.category}`,
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      tags: [product.price.toString() + '€', product.active ? this.i18n.translate('admin.active') : this.i18n.translate('admin.inactive')],
    }));
  });

  ngOnInit(): void {
    const firstAvailableTab = this.adminTabs()[0];
    if (firstAvailableTab) {
      this.activeTab.set(firstAvailableTab.id);
    }
    this.loadAllData();
  }

  private loadAllData(): void {
    this.loading.set(true);

    if (this.isAdmin()) {
      this.loadTypeRequests();
    }

    if (this.hasProfile('seller')) {
      this.marketplaceService.getMyProducts().subscribe({
        next: (products: PageResponse<ProductResponse>) => {
          const mapped = products.content.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: Number(product.price),
            stock: product.stock,
            category: product.category,
            imageUrl: product.imageUrl || '',
            active: product.active
          }));
          this.adminProducts.set(mapped);
        },
        error: (err) => console.error('Error loading products:', err)
      });
    }

    if (this.hasProfile('shelter')) {
      this.adoptionService.getAdoptionRequestsForMyPets().subscribe({
        next: (requests: PageResponse<AdoptionRequest>) => this.adminAdoptions.set(requests.content),
        error: (err) => console.error('Error loading adoption requests:', err)
      });

      const ownerId = this.authService.user()?.id;
      if (ownerId) {
        this.petService.getPetsByOwner(ownerId).subscribe({
          next: pets => this.shelterPets.set(pets),
          error: (err) => {
            console.error('Error loading shelter animals:', err);
            this.messageService.add({
              severity: 'error',
              summary: this.i18n.translate('admin.error'),
              detail: this.i18n.translate('admin.shelterAnimalsLoadError')
            });
          }
        });
      }

      this.shelterManagementService.getMyDonationLink().subscribe({
        next: link => this.donationUrl = link.donationUrl ?? '',
        error: err => {
          console.error('Error loading shelter donation link:', err);
          this.showShelterError('admin.donationLinkLoadError');
        }
      });

      this.shelterManagementService.getMyVisitRequests().subscribe({
        next: visits => this.shelterVisitRequests.set(visits),
        error: err => {
          console.error('Error loading shelter visit requests:', err);
          this.showShelterError('admin.shelterVisitsLoadError');
        }
      });
    }

    // Load orders and invoices for sellers
    if (this.userProfileType() === 'seller') {
      this.loadMyOrders();
      this.loadMyInvoices();
    }

    // Set loading to false after a short delay
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  editProfessionalProfile(): void {
    void this.router.navigate(['/settings'], { queryParams: { editProfile: '1' } });
  }

  // Product handlers (for sellers)
  handleCreateProduct(productData: any) {
    const request: CreateProductRequest = {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      category: productData.category,
      imageUrl: productData.imageUrl?.[0]?.objectURL || undefined
    };

    this.marketplaceService.createProduct(request).subscribe({
      next: (product: any) => {
        const mapped: ProductItem = {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: Number(product.price),
          stock: product.stock,
          category: product.category,
          imageUrl: product.imageUrl || '',
          active: product.active
        };
        this.adminProducts.update(products => [...products, mapped]);
        this.showCreateProductForm.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('admin.productCreated'),
          detail: this.i18n.translate('admin.productCreatedDetail', { name: product.name })
        });
      },
      error: (err) => {
        console.error('Error creating product:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.i18n.translate('admin.productCreateError')
        });
      }
    });
  }

  deleteProductById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('admin.underDevelopment'),
      detail: this.i18n.translate('admin.deleteProductsSoon')
    });
  }

  // Order handlers (for sellers)
  loadMyOrders(): void {
    this.ordersLoading.set(true);
    this.ordersService.getMyOrders().subscribe({
      next: (orders) => this.adminOrders.set(orders),
      error: (err) => {
        console.error('Error loading orders:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('admin.error'),
          detail: this.i18n.translate('admin.ordersLoadError')
        });
        this.ordersLoading.set(false);
      },
      complete: () => this.ordersLoading.set(false)
    });
  }

  updateOrderStatus(orderId: string, status: string): void {
    this.ordersService.updateOrderStatus(orderId, status).subscribe({
      next: (updated) => {
        this.adminOrders.update(orders =>
          orders.map(o => o.id === updated.id ? updated : o)
        );
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('admin.orderUpdated'),
          detail: this.i18n.translate('admin.orderStatusChanged', { status })
        });
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('admin.error'),
          detail: this.i18n.translate('admin.orderUpdateError')
        });
      }
    });
  }

  selectOrder(orderId: string): void {
    this.selectedOrderId.set(orderId);
    this.ordersService.getOrderDetail(orderId).subscribe({
      next: (order) => {
        this.adminOrders.update(orders =>
          orders.map(o => o.id === order.id ? order : o)
        );
      },
      error: (err) => console.error('Error loading order detail:', err)
    });
  }

  orderStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      case 'SHIPPED': return 'info';
      case 'PREPARING': return 'warn';
      case 'PAID': return 'secondary';
      default: return 'secondary';
    }
  }

  // Invoice handlers (for sellers)
  loadMyInvoices(): void {
    this.invoicesLoading.set(true);
    this.invoicesService.getMyInvoices().subscribe({
      next: (invoices) => this.adminInvoices.set(invoices),
      error: (err) => {
        console.error('Error loading invoices:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('admin.error'),
          detail: this.i18n.translate('admin.invoicesLoadError')
        });
        this.invoicesLoading.set(false);
      },
      complete: () => this.invoicesLoading.set(false)
    });
  }

  prepareGenerateInvoice(orderId: string): void {
    this.invoiceForOrderId.set(orderId);
    this.showGenerateInvoiceDialog.set(true);
  }

  generateInvoiceForOrder(taxAmount: number | null): void {
    const orderId = this.invoiceForOrderId();
    if (!orderId) return;
    this.invoicesService.generateInvoice({
      orderId,
      taxAmount: taxAmount ?? 0
    }).subscribe({
      next: (invoice) => {
        this.adminInvoices.update(invoices => [...invoices, invoice]);
        this.showGenerateInvoiceDialog.set(false);
        this.invoiceForOrderId.set(null);
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('admin.invoiceGenerated'),
          detail: this.i18n.translate('admin.invoiceGeneratedDetail', { number: invoice.invoiceNumber })
        });
      },
      error: (err) => {
        console.error('Error generating invoice:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('admin.error'),
          detail: this.i18n.translate('admin.invoiceGenerateError')
        });
      }
    });
  }

  downloadInvoice(pdfUrl: string): void {
    window.open(pdfUrl, '_blank');
  }

  // Tabs configuration
  adminTabs = computed((): Tab[] => {
    const t = this.i18n;
    if (this.isAdmin()) {
      return [{ id: 'type-requests', label: t.translate('admin.tabs.typeRequests'), icon: 'pending_actions' }];
    }

    switch (this.userProfileType()) {
      case 'vet':
        return [{ id: 'services', label: t.translate('admin.tabs.services'), icon: 'medical_services' }];
      case 'seller':
        return [
          { id: 'products', label: t.translate('admin.tabs.products'), icon: 'shopping_bag' },
          { id: 'orders', label: t.translate('admin.tabs.orders'), icon: 'shopping_cart' },
          { id: 'invoices', label: t.translate('admin.tabs.invoices'), icon: 'file' }
        ];
      case 'shelter':
        return [
          { id: 'shelter-overview', label: t.translate('admin.tabs.shelterOverview'), icon: 'home' },
          { id: 'adoptions', label: t.translate('admin.tabs.adoptions'), icon: 'favorite' },
          { id: 'donations', label: t.translate('admin.tabs.donations'), icon: 'volunteer_activism' },
          { id: 'shelter-visits', label: t.translate('admin.tabs.shelterVisits'), icon: 'event' }
        ];
      case 'trainer':
        return [{ id: 'professional-profile', label: t.translate('admin.tabs.professionalProfile'), icon: 'fitness_center' }];
      default:
        return [];
    }
  });

  onTabChange(tabId: string) {
    this.setActiveTab(tabId);
  }

  saveDonationLink(value = this.donationUrl): void {
    const donationUrl = value.trim();
    if (donationUrl) {
      try {
        const url = new URL(donationUrl);
        if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
          throw new Error('Invalid donation URL');
        }
      } catch {
        this.showShelterError('admin.invalidDonationLink');
        return;
      }
    }

    this.donationLinkSaving.set(true);
    this.shelterManagementService.updateMyDonationLink(donationUrl).subscribe({
      next: updated => {
        this.donationUrl = updated.donationUrl ?? '';
        this.donationLinkSaving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('common.success'),
          detail: this.i18n.translate('admin.donationLinkSaved')
        });
      },
      error: err => {
        this.donationLinkSaving.set(false);
        console.error('Error saving shelter donation link:', err);
        this.showShelterError('admin.donationLinkSaveError');
      }
    });
  }

  clearDonationLink(): void {
    this.saveDonationLink('');
  }

  visitStatusLabel(status: ShelterVisitStatus): string {
    return this.i18n.translate(`admin.visitStatus.${status.toLowerCase()}`);
  }

  visitStatusSeverity(status: ShelterVisitStatus): 'success' | 'danger' | 'warn' {
    if (status === 'CONFIRMED' || status === 'COMPLETED') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    return 'warn';
  }

  openAlternativeVisit(visit: ShelterVisitRequest): void {
    this.alternativeVisitId.set(visit.id);
    const requested = new Date(visit.visitAt);
    requested.setDate(requested.getDate() + 1);
    this.alternativeVisitDate = this.toDateTimeLocal(requested);
  }

  proposeVisitTime(visit: ShelterVisitRequest): void {
    if (!this.alternativeVisitDate) return;
    const proposedDate = new Date(this.alternativeVisitDate);
    if (Number.isNaN(proposedDate.getTime()) || proposedDate <= new Date()) {
      this.showShelterError('admin.invalidAlternativeVisitDate');
      return;
    }
    this.updateVisitStatus(
      visit,
      'ALTERNATIVE_PROPOSED',
      this.i18n.translate('admin.alternativeVisitMessage', {
        date: proposedDate.toLocaleString()
      }),
      this.alternativeVisitDate
    );
    this.alternativeVisitId.set(null);
  }

  updateVisitStatus(
    visit: ShelterVisitRequest,
    status: ShelterVisitStatus,
    responseNote?: string,
    proposedVisitAt?: string
  ): void {
    this.shelterManagementService.updateVisitStatus(visit.id, status, responseNote, proposedVisitAt).subscribe({
      next: updated => this.shelterVisitRequests.update(visits =>
        visits.map(item => item.id === updated.id ? updated : item)
      ),
      error: err => {
        console.error('Error updating shelter visit request:', err);
        this.showShelterError('admin.shelterVisitUpdateError');
      }
    });
  }

  private toDateTimeLocal(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  private showShelterError(detailKey: string): void {
    this.messageService.add({
      severity: 'error',
      summary: this.i18n.translate('admin.error'),
      detail: this.i18n.translate(detailKey)
    });
  }

  // ========== SOLICITUDES DE TIPO DE PERFIL (solo admin) ==========

  loadTypeRequests(): void {
    if (!this.isAdmin()) return;
    this.profileService.getPendingTypeRequests().subscribe({
      next: (requests) => this.typeRequests.set(requests ?? []),
      error: (err) => {
        console.error('Error loading type requests:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('admin.error'),
          detail: this.i18n.translate('admin.typeRequestsError')
        });
      }
    });
  }

  /** Etiqueta traducida de un tipo de perfil (actual o solicitado). */
  typeRequestLabel(type: string | null | undefined): string {
    const keys: Record<string, string> = {
      vet: 'profile.form.vet',
      shelter: 'profile.form.shelter',
      user: 'profile.form.user',
      trainer: 'profile.form.trainer',
      seller: 'profile.form.seller'
    };
    return this.i18n.translate(keys[(type ?? '').toLowerCase()] ?? 'admin.unknownSpecies');
  }

  /** Detalle acreditativo según el tipo solicitado (nº colegiado / registro). */
  typeRequestDetail(req: UserProfileResponse): string {
    const type = (req.pendingProfileType ?? '').toLowerCase();
    if (type === 'vet' && req.licenseNumber) {
      return `${this.i18n.translate('profile.form.licenseNumber')}: ${req.licenseNumber}`;
    }
    if (type === 'shelter' && req.charityNumber) {
      return `${this.i18n.translate('profile.form.charityNumber')}: ${req.charityNumber}`;
    }
    return '';
  }

  approveTypeRequest(req: UserProfileResponse): void {
    this.profileService.approveTypeRequest(req.id).subscribe({
      next: () => {
        this.typeRequests.update(list => list.filter(item => item.id !== req.id));
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('admin.typeRequestApproved'),
          detail: this.i18n.translate('admin.typeRequestApprovedDetail', {
            name: `${req.firstName} ${req.lastName}`,
            type: this.typeRequestLabel(req.pendingProfileType)
          })
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('admin.error'),
          detail: this.i18n.translate('admin.typeRequestActionError')
        });
      }
    });
  }

  rejectTypeRequest(req: UserProfileResponse): void {
    this.profileService.rejectTypeRequest(req.id).subscribe({
      next: () => {
        this.typeRequests.update(list => list.filter(item => item.id !== req.id));
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('admin.typeRequestRejected'),
          detail: this.i18n.translate('admin.typeRequestRejectedDetail', {
            name: `${req.firstName} ${req.lastName}`
          })
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('admin.error'),
          detail: this.i18n.translate('admin.typeRequestActionError')
        });
      }
    });
  }

  // ========== ADOPCIONES ==========

    readonly adoptionStages: AdoptionStatus[] = ['pending', 'pending_contact', 'pending_delivery', 'completed'];

  adoptionStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return this.i18n.translate('admin.pendingApproval');
      case 'pending_contact': return this.i18n.translate('admin.inContact');
      case 'pending_delivery': return this.i18n.translate('admin.pendingDelivery');
      case 'completed': return this.i18n.translate('admin.completedAdapter');
      case 'approved': return this.i18n.translate('admin.approved');
      case 'rejected': return this.i18n.translate('admin.rejected');
      default: return this.i18n.translate('admin.pendingApproval');
    }
  }

  adoptionStatusSeverity(status: string): 'success' | 'danger' | 'warn' {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
      case 'pending_contact':
      case 'pending_delivery':
      default:
        return 'warn';
    }
  }

  adoptionStageShortLabel(stage: AdoptionStatus): string {
    switch (stage) {
      case 'pending': return this.i18n.translate('admin.stagePending');
      case 'pending_contact': return this.i18n.translate('admin.stageContact');
      case 'pending_delivery': return this.i18n.translate('admin.stageDelivery');
      case 'completed': return this.i18n.translate('admin.stageCompleted');
      default: return stage;
    }
  }

    stageIndexOf(status: string): number {
    return this.adoptionStages.indexOf((status || '').toLowerCase() as AdoptionStatus);
  }

  canAdvance(status: string): boolean {
    const s = (status || '').toLowerCase();
    const i = this.adoptionStages.indexOf(s as AdoptionStatus);
    // Permite avanzar si el status está en la secuencia y no es el último (completed)
    return i >= 0 && i < this.adoptionStages.length - 1;
  }

  canReject(status: string): boolean {
    const s = (status || '').toLowerCase();
    // Solo NO permite rechazar si ya está completed (terminal) o rejected (terminal)
    return s !== 'completed' && s !== 'rejected';
  }

  isCompleted(status: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'completed';
  }

  advanceAdoption(req: AdoptionRequest): void {
    const next = this.adoptionStages[this.stageIndexOf(req.status) + 1];
    if (!next) return;
    this.updateAdoptionStatus(req, next);
  }

  rejectAdoption(req: AdoptionRequest): void {
    this.updateAdoptionStatus(req, 'rejected');
  }

  contactAdopter(req: AdoptionRequest): void {
    this.router.navigate(['/messages'], {
      queryParams: { userId: req.adopterId, name: req.adopterName }
    });
  }

  private updateAdoptionStatus(req: AdoptionRequest, status: AdoptionStatus): void {
    this.adoptionService.updateAdoptionRequestStatus(req.id, status).subscribe({
      next: (updated) => {
        this.adminAdoptions.update(requests => requests.map(r => r.id === updated.id ? updated : r));
        // Al finalizar la adopción, notificar cambio de propiedad de la compañer@
        if (status === 'completed') {
          this.petOwnershipEvent.notify(req.petId, 'adoption_completed', req.id);
        }
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('admin.requestUpdated'),
          detail: this.i18n.translate('admin.requestUpdatedDetail', { adopter: req.adopterName, pet: req.petName, status: this.adoptionStatusLabel(status) })
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.i18n.translate('admin.adoptionUpdateError')
        });
      }
    });
  }

}
