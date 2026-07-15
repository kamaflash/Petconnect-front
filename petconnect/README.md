# PetConnect Frontend

Frontend de la plataforma PetConnect desarrollado con Angular siguiendo una arquitectura Feature First basada en DDD y Clean Architecture.

## Stack Tecnológico

- **Angular 22** (última versión estable)
- **PrimeNG 22** - Librería oficial de componentes UI
- **PrimeFlex** - Sistema de utilidades CSS responsive
- **Angular Signals** - Gestión de estado reactivo
- **Standalone Components** - Arquitectura sin NgModules
- **Functional Guards & Interceptors** - Routing y HTTP modernos
- **Zoneless Change Detection** - Rendimiento optimizado

## Arquitectura

El proyecto sigue una arquitectura **Feature First** orientada al dominio, con las siguientes capas:

```
src/app/
├── auth/                    # Dominio de autenticación
│   ├── domain/             # Entidades y repositorios abstractos
│   ├── infrastructure/       # Servicios concretos
│   └── presentation/       # Componentes de UI
├── shared/                   # Código compartido
│   ├── ui/                   # Plataforma de UI (PrimeNG)
│   └── infrastructure/       # Guards, interceptors, i18n
└── app.config.ts            # Configuración de la aplicación
```

### Flujo de datos

```
Presentation → Facade → Repository → API → Spring Boot
```

## Características

- ✅ **Responsive** - Adaptado a todos los dispositivos
- ✅ **Accesible** - WCAG 2.1 AA compliant
- ✅ **Internacionalización** - Preparado para múltiples idiomas
- ✅ **Lazy Loading** - Carga diferida de módulos
- ✅ **Signals** - Estado reactivo sin suscripciones
- ✅ **Standalone** - Sin NgModules, 100% moderno

## Desarrollo

### Servidor de desarrollo

```bash
npm start
```

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente.

### Build de producción

```bash
npm run build
```

## Dominios implementados

- **Auth** - Login, registro, JWT, refresh tokens
- **Users** - Perfil, configuración, preferencias
- **Pets** - Família, razas, especies, fotografías

## Próximos pasos

- [ ] Implementar Signal Store para estado compartido
- [ ] Añadir más dominios (Health, Content, Social, etc.)
- [ ] Configurar pruebas unitarias y E2E
- [ ] Implementar PWA
- [ ] Añadir internacionalización completa
