import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- Columna 1 - Logo y descripción -->
          <div class="footer-col">
            <div class="footer-logo">
              <div class="footer-logo-icon">
                <i class="pi pi-paw text-white text-base"></i>
              </div>
              <span class="footer-logo-text">Lumio</span>
            </div>
            <p class="footer-description">
              La plataforma definitiva para el cuidado, seguimiento y conexión de tu compañero peludo.
            </p>
            <div class="footer-social">
              <a href="#" class="social-link" aria-label="Facebook">
                <i class="pi pi-facebook"></i>
              </a>
              <a href="#" class="social-link" aria-label="Twitter">
                <i class="pi pi-twitter"></i>
              </a>
              <a href="#" class="social-link" aria-label="Instagram">
                <i class="pi pi-instagram"></i>
              </a>
              <a href="#" class="social-link" aria-label="YouTube">
                <i class="pi pi-youtube"></i>
              </a>
            </div>
          </div>

          <!-- Columna 2 - Producto -->
          <div class="footer-col">
            <h4 class="footer-title">Producto</h4>
            <ul class="footer-links">
              <li><a href="#">Características</a></li>
              <li><a href="#">Precios</a></li>
              <li><a href="#">Actualizaciones</a></li>
              <li><a href="#">Roadmap</a></li>
            </ul>
          </div>

          <!-- Columna 3 - Compañía -->
          <div class="footer-col">
            <h4 class="footer-title">Compañía</h4>
            <ul class="footer-links">
              <li><a href="#">Sobre nosotros</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contacto</a></li>
              <li><a href="#">Trabaja con nosotros</a></li>
            </ul>
          </div>

          <!-- Columna 4 - Legal -->
          <div class="footer-col">
            <h4 class="footer-title">Legal</h4>
            <ul class="footer-links">
              <li><a href="#">Privacidad</a></li>
              <li><a href="#">Términos de uso</a></li>
              <li><a href="#">Política de cookies</a></li>
              <li><a href="#">Aviso legal</a></li>
            </ul>
          </div>
        </div>

        <!-- Footer bottom -->
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <span class="footer-copyright">
              &copy; 2026 Lumio. Todos los derechos reservados.
            </span>
            <div class="footer-bottom-links">
              <a href="#">Privacidad</a>
              <span class="footer-separator">|</span>
              <a href="#">Términos</a>
              <span class="footer-separator">|</span>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: var(--bitbucket-header-bg);
      border-top: 1px solid var(--bitbucket-border);
      transition: background-color 0.3s ease, border-color 0.3s ease;
      padding: 3rem 0 1.5rem 0;
      width: 100%;
    }

    .dark .app-footer {
      background-color: var(--bitbucket-header-bg);
      border-top-color: var(--bitbucket-border);
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2.5rem;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .footer-logo-icon {
      width: 32px;
      height: 32px;
      background-color: var(--primary-color);
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background-color 0.3s ease;
    }

    .footer-logo-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      transition: color 0.3s ease;
    }

    .dark .footer-logo-text {
      color: var(--bitbucket-text-primary);
    }

    .footer-description {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
      line-height: 1.6;
      margin: 0;
      max-width: 300px;
      transition: color 0.3s ease;
    }

    .dark .footer-description {
      color: var(--bitbucket-text-secondary);
    }

    .footer-social {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .social-link {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      color: var(--bitbucket-text-secondary);
      background-color: var(--bitbucket-bg-hover);
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .social-link:hover {
      background-color: var(--primary-color);
      color: white;
      transform: translateY(-2px);
    }

    .dark .social-link {
      background-color: var(--bitbucket-bg-hover);
      color: var(--bitbucket-text-secondary);
    }

    .dark .social-link:hover {
      background-color: var(--primary-color);
      color: white;
    }

    .footer-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--bitbucket-text-primary);
      margin: 0 0 0.25rem 0;
      transition: color 0.3s ease;
    }

    .dark .footer-title {
      color: var(--bitbucket-text-primary);
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-links li {
      margin: 0;
    }

    .footer-links a {
      color: var(--bitbucket-text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }

    .footer-links a:hover {
      color: var(--primary-color);
    }

    .dark .footer-links a {
      color: var(--bitbucket-text-secondary);
    }

    .dark .footer-links a:hover {
      color: var(--primary-color);
    }

    .footer-bottom {
      border-top: 1px solid var(--bitbucket-border);
      padding-top: 1.5rem;
      transition: border-color 0.3s ease;
    }

    .dark .footer-bottom {
      border-top-color: var(--bitbucket-border);
    }

    .footer-bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .footer-copyright {
      font-size: 0.813rem;
      color: var(--bitbucket-text-secondary);
      transition: color 0.3s ease;
    }

    .dark .footer-copyright {
      color: var(--bitbucket-text-secondary);
    }

    .footer-bottom-links {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.813rem;
    }

    .footer-bottom-links a {
      color: var(--bitbucket-text-secondary);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .footer-bottom-links a:hover {
      color: var(--primary-color);
    }

    .dark .footer-bottom-links a {
      color: var(--bitbucket-text-secondary);
    }

    .dark .footer-bottom-links a:hover {
      color: var(--primary-color);
    }

    .footer-separator {
      color: var(--bitbucket-border);
      transition: color 0.3s ease;
    }

    .dark .footer-separator {
      color: var(--bitbucket-border);
    }

    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }
    }

    @media (max-width: 640px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .footer-description {
        max-width: 100%;
      }

      .footer-bottom-content {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
      }

      .footer-bottom-links {
        flex-wrap: wrap;
        justify-content: center;
      }

      .app-footer {
        padding: 2rem 0 1rem 0;
      }

      .footer-container {
        padding: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .footer-grid {
        gap: 1rem;
      }

      .footer-social {
        gap: 0.375rem;
      }

      .social-link {
        width: 32px;
        height: 32px;
      }
    }
  `]
})
export class FooterComponent {}
