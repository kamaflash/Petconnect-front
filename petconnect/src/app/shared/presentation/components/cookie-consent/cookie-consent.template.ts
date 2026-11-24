export const CONSENT_TEMPLATE = `
    @if (visible()) {
      <div class="cookie-blocker"></div>
      <div class="consent-banner" role="region" aria-label="{{ 'consent.title' | transloco }}">
        <div class="consent-content">
          <strong class="consent-title">{{ 'consent.title' | transloco }}</strong>
          <span class="consent-desc">{{ 'consent.description' | transloco }}</span>
          @if (customizing()) {
            <fieldset class="consent-categories">
              <legend class="consent-subtitle">{{ 'consent.preferencesTitle' | transloco }}</legend>
              <div class="consent-category">
                <div class="consent-category-head">
                  <span class="consent-category-name">{{ 'consent.necessaryTitle' | transloco }}</span>
                  <span class="consent-always">{{ 'consent.alwaysOn' | transloco }}</span>
                </div>
                <p class="consent-category-desc">{{ 'consent.necessaryDesc' | transloco }}</p>
                <label class="consent-check consent-check-locked">
                  <p-checkbox [ngModel]="true" [disabled]="true" [binary]="true"
                    [attr.aria-label]="'consent.necessaryTitle' | transloco" />
                  <span>{{ 'consent.necessaryLabel' | transloco }}</span>
                </label>
              </div>
              <div class="consent-category">
                <div class="consent-category-head">
                  <span class="consent-category-name">{{ 'consent.functionalTitle' | transloco }}</span>
                </div>
                <p class="consent-category-desc">{{ 'consent.functionalDesc' | transloco }}</p>
                <label class="consent-check">
                  <p-checkbox [(ngModel)]="functional" [binary]="true"
                    [attr.aria-label]="'consent.functionalTitle' | transloco" />
                  <span>{{ 'consent.functionalLabel' | transloco }}</span>
                </label>
              </div>
            </fieldset>
          }
          <div class="consent-actions">
            @if (!customizing()) {
              <p-button [label]="'consent.acceptAll' | transloco" (onClick)="acceptAll()" />
              <p-button [label]="'consent.onlyNecessary' | transloco" (onClick)="acceptNecessary()" styleClass="p-button-outlined" />
              <p-button [label]="'consent.configure' | transloco" (onClick)="customizing.set(true)" styleClass="p-button-text" />
            } @else {
              <p-button [label]="'consent.savePreferences' | transloco" (onClick)="saveCustom()" />
              <p-button [label]="'consent.back' | transloco" (onClick)="customizing.set(false)" styleClass="p-button-text" />
            }
          </div>
        </div>
      </div>
    }
`;
