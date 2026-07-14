import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeading } from '../../../components/section-heading';
import { Reveal } from '../../../core/reveal';
import { Section } from '../../../core/scroll-spy';
import { EDUCATION, EXPERIENCE } from '../../../data/experience';

@Component({
  selector: 'app-experience-section',
  imports: [SectionHeading, Reveal, Section],
  templateUrl: './experience-section.html',
  styleUrl: './experience-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSection {
  protected readonly experience = EXPERIENCE;
  protected readonly education = EDUCATION;
}
