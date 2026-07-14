import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../data/projects';
import { Icon } from '../icon';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink, Icon],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<Project>();

  protected readonly techPreview = computed(() =>
    this.project().tech.slice(0, this.project().featured ? 8 : 5),
  );
}
