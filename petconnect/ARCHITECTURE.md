# Arquitectura Frontend - PetConnect

## Principios Aplicados

### Feature First + DDD

El proyecto está organizado por dominios funcionales, siguiendo los principios de Domain Driven Design:

```
src/app/
├── {domain}/
│   ├── domain/              # Núcleo del dominio
│   │   ├── entities/        # Modelos de dominio
│   │   ├── value_objects/   # Objetos de valor
│   │   ├── domain_services/ # Servicios de dominio
│   │   ├── repositories/    # Interfaces de repositorio
│   │   ├── events/          # Eventos de dominio
│   │   └── exceptions/      # Excepciones de dominio
│   ├── application/         # Casos de uso
│   │   ├── use_cases/       # Lógica de aplicación
│   │   ├── commands/        # Comandos (CQRS)
│   │   ├── queries/         # Consultas (CQRS)
│   │   ├── dto/             # Objetos de transferencia
│   │   └── mappers/         # Mapeadores
│   ├── infrastructure/      # Implementaciones técnicas
│   │   ├── persistence/     # Persistencia
│   │   ├── repositories/    # Implementaciones de repositorios
│   │   ├── configuration/   # Configuración
│   │   └── external_services/ # Servicios externos
│   └── presentation/        # UI
│       ├── pages/           # Páginas/containers
│       └── components/      # Componentes presentacionales
└── shared/                  # Código compartido
    ├── ui/                # Plataforma de UI
    └── infrastructure/    # Cross-cutting concerns
```

## Tecnologías Modernas de Angular

### Standalone Components

```typescript
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ...],
  template: `...`
})
export class LoginPageComponent {}
```

### Angular Signals

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
}
```

### Functional Guards

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
```

### Functional Interceptors

```typescript
export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request);
};
```

## Flujo de Datos

```
Presentation (Component)
    ↓
Facade (opcional, para estado compartido)
    ↓
Repository (interfaz de dominio)
    ↓
API Service (implementación HTTP)
    ↓
Spring Boot Backend
```

## Responsabilidades

### Container Components
- Gestionan el estado local con Signals
- Orquestan la interacción del usuario
- Inyectan y llaman a los casos de uso

### Presentational Components
- Reciben datos vía inputs
- Emiten eventos vía outputs
- Son puramente UI, sin lógica de negocio

## Accesibilidad (WCAG 2.1 AA)

- Uso de atributos ARIA
- Navegación por teclado
- Contraste de colores adecuado
- Focus indicators visibles

## Internacionalización

Preparado para i18n con:
- Detección automática de idioma del navegador
- Soporte para español e inglés
- Estructura preparada para expansión
