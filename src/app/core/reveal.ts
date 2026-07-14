import {
  Directive,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Fades an element in the first time it enters the viewport.
 * Usage: `<div appReveal>` or `<div appReveal="120ms">` for a stagger delay.
 * Styling lives in the global `.reveal` / `.is-visible` classes, which also
 * neutralize the effect under `prefers-reduced-motion`.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'reveal',
    '[class.is-visible]': 'visible()',
    '[style.--reveal-delay]': 'appReveal() || null',
  },
})
export class Reveal implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer: IntersectionObserver | undefined;

  /** Optional transition delay, e.g. '120ms'. */
  readonly appReveal = input('');

  protected readonly visible = signal(false);

  constructor() {
    afterNextRender(() => {
      if (
        typeof IntersectionObserver === 'undefined' ||
        matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        this.visible.set(true);
        return;
      }
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.visible.set(true);
            this.observer?.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
      );
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
