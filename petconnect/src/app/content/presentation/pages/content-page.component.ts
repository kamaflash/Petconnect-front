import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TranslocoModule } from '@jsverse/transloco';

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image: string;
  likes: number;
  comments: number;
  date: string;
}

@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    AvatarModule,
    TagModule,
    TranslocoModule,
  ],
  template: `
    <div class="page-content">
      <div class="flex justify-between align-items-center mb-4">
        <h1 class="text-2xl font-bold m-0">{{ 'content.posts' | transloco }}</h1>
        <p-button
          label="{{ 'content.newPost' | transloco }}"
          icon="pi pi-plus"
          (onClick)="showAddDialog()"
        />
      </div>

      <div class="flex flex-column gap-3">
        @for (post of posts(); track post.id) {
          <p-card>
            <div class="flex gap-3">
              <p-avatar [image]="post.avatar" shape="circle" />
              <div class="flex-1">
                <div class="flex align-items-center gap-2 mb-2">
                  <h3 class="m-0">{{ post.author }}</h3>
                  <span class="text-sm text-secondary">{{ post.date }}</span>
                </div>
                <p class="m-0 mb-3">{{ post.content }}</p>
                <img
                  [src]="post.image"
                  [alt]="'content.imageAlt' | transloco"
                  class="w-full mb-3 border-round"
                  style="max-height: 300px; object-fit: cover"
                />
                <div class="flex gap-3">
                  <button class="p-button p-button-text p-button-sm">
                    <i class="pi pi-heart"></i>
                    {{ post.likes }}
                  </button>
                  <button class="p-button p-button-text p-button-sm">
                    <i class="pi pi-comment"></i>
                    {{ post.comments }}
                  </button>
                </div>
              </div>
            </div>
          </p-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-content {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 1.5rem;
    }
  `],
})
export class ContentPageComponent {
  posts = signal<Post[]>([
    {
      id: '1',
      author: 'Juan Pérez',
      avatar: 'https://i.pravatar.cc/150?img=10',
      content:
        '¡Max disfrutando de su nuevo cama ortopédica! Gracias @GroomingHappyPets por la recomendación.',
      image: 'https://placehold.co/600x400?text=Mascota+1',
      likes: 24,
      comments: 5,
      date: 'Hace 2 horas',
    },
    {
      id: '2',
      author: 'María López',
      avatar: 'https://i.pravatar.cc/150?img=5',
      content:
        'Luna hoy jugando con su nuevo juguete. ¡Nunca había estado tan activa!',
      image: 'https://placehold.co/600x400?text=Mascota+2',
      likes: 42,
      comments: 8,
      date: 'Hace 5 horas',
    },
  ]);

  showAddDialog() {
    // TODO: Implement add dialog
  }
}
