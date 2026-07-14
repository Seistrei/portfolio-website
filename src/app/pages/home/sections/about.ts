import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeading } from '../../../components/section-heading';
import { Reveal } from '../../../core/reveal';
import { Section } from '../../../core/scroll-spy';
import { ABOUT_PARAGRAPHS } from '../../../data/profile';

interface SnapshotEntry {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-about',
  imports: [SectionHeading, Reveal, Section],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly paragraphs = ABOUT_PARAGRAPHS;
  protected readonly snapshot: readonly SnapshotEntry[] = [
    { label: 'role', value: 'Software Engineer II @ RTX' },
    { label: 'education', value: "CU Boulder · B.S. Computer Science '23" },
    { label: 'building', value: 'Nykta, an autonomous AI companion' },
    { label: 'off hours', value: 'game design and fiction writing' },
  ];
}
