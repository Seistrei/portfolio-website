import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Icon } from '../../components/icon';
import { Reveal } from '../../core/reveal';
import { PROJECTS, Project, projectBySlug } from '../../data/projects';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, Icon, Reveal],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  private readonly titleService = inject(Title);

  /** Bound from the :slug route parameter; the route guard guarantees it resolves. */
  readonly slug = input.required<string>();

  protected readonly project = computed<Project>(() => projectBySlug(this.slug())!);

  protected readonly neighbors = computed(() => {
    const index = PROJECTS.findIndex((p) => p.slug === this.slug());
    return {
      prev: index > 0 ? PROJECTS[index - 1] : null,
      next: index >= 0 && index < PROJECTS.length - 1 ? PROJECTS[index + 1] : null,
    };
  });

  constructor() {
    effect(() => this.titleService.setTitle(`${this.project().name} · Heath Rohlman`));
  }
}
