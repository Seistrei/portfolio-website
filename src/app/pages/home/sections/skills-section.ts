import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeading } from '../../../components/section-heading';
import { Reveal } from '../../../core/reveal';
import { Section } from '../../../core/scroll-spy';
import { SKILL_GROUPS } from '../../../data/skills';

@Component({
  selector: 'app-skills-section',
  imports: [SectionHeading, Reveal, Section],
  templateUrl: './skills-section.html',
  styleUrl: './skills-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsSection {
  protected readonly groups = SKILL_GROUPS;
}
