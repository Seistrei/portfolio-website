import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../../components/icon';
import { Reveal } from '../../../core/reveal';
import { Section } from '../../../core/scroll-spy';
import { PROFILE } from '../../../data/profile';

@Component({
  selector: 'app-contact-section',
  imports: [Icon, Reveal, Section],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  protected readonly profile = PROFILE;
}
