import { ChangeDetectionStrategy, Component } from '@angular/core';
import { About } from './sections/about';
import { ContactSection } from './sections/contact-section';
import { ExperienceSection } from './sections/experience-section';
import { Hero } from './sections/hero';
import { ProjectsSection } from './sections/projects-section';
import { SkillsSection } from './sections/skills-section';

@Component({
  selector: 'app-home',
  imports: [Hero, About, ExperienceSection, ProjectsSection, SkillsSection, ContactSection],
  template: `
    <app-hero />
    <app-about />
    <app-experience-section />
    <app-projects-section />
    <app-skills-section />
    <app-contact-section />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
