import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * @deprecated Alias heredado de `/adoptions/my-requests`. Redirige a la
 * pestaña "Mis solicitudes" dentro de la página de adopciones.
 */
@Component({
  selector: 'app-my-adoption-requests-page',
  standalone: true,
  template: ``,
})
export class MyAdoptionRequestsPageComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.navigate(['/adoptions'], { queryParams: { tab: 'requests' } });
  }
}
