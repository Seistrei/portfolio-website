import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../core/reveal';

@Component({
  selector: 'app-section-heading',
  imports: [Reveal],
  template: `
    <div class="heading" appReveal>
      <span class="index mono" aria-hidden="true">{{ index() }}</span>
      <h2>{{ title() }}</h2>
      <span class="rule" aria-hidden="true"></span>
    </div>
  `,
  styles: `
    .heading {
      display: flex;
      align-items: baseline;
      gap: 0.9rem;
      margin-bottom: 2.75rem;
    }

    .index {
      color: var(--accent);
    }

    h2 {
      font-size: clamp(1.55rem, 3vw, 2.1rem);
      letter-spacing: -0.01em;
    }

    .rule {
      flex: 1;
      align-self: center;
      height: 1px;
      margin-left: 0.6rem;
      background: linear-gradient(90deg, var(--border-strong), transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeading {
  readonly index = input.required<string>();
  readonly title = input.required<string>();
}
