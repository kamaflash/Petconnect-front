import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule],
  template: `
    <p-card [header]="header()">
      <ng-content></ng-content>
    </p-card>
  `
})
export class UiCardComponent {
  header = input<string>('');
}
