import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectCard } from '../../../components/project-card/project-card';
import { SectionHeading } from '../../../components/section-heading';
import { Reveal } from '../../../core/reveal';
import { Section } from '../../../core/scroll-spy';
import { PROJECTS } from '../../../data/projects';

@Component({
  selector: 'app-projects-section',
  imports: [ProjectCard, SectionHeading, Reveal, Section],
  templateUrl: './projects-section.html',
  styleUrl: './projects-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSection {
  protected readonly featured = PROJECTS.filter((p) => p.featured);
  protected readonly rest = PROJECTS.filter((p) => !p.featured);
}
