import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private readonly _visible = signal(false);
  private readonly _message = signal('Cargando...');

  readonly visible = this._visible.asReadonly();
  readonly message = this._message.asReadonly();

  show(message: string = 'Cargando...'): void {
    this._message.set(message);
    this._visible.set(true);
  }

  hide(): void {
    this._visible.set(false);
  }
}
