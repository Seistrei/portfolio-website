import {
  Directive,
  ElementRef,
  Injectable,
  OnDestroy,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Tracks which registered section currently sits in the reading band of the
 * viewport (roughly its upper-middle), for nav highlighting.
 */
@Injectable({ providedIn: 'root' })
export class ScrollSpy {
  /** Registered sections in registration (= document) order. */
  private readonly sections = new Map<Element, string>();
  private readonly inBand = new Set<Element>();
  private observer: IntersectionObserver | undefined;

  readonly activeId = signal<string | null>(null);

  register(el: Element, id: string): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.sections.set(el, id);
    this.observer ??= new IntersectionObserver((entries) => this.onIntersect(entries), {
      // A thin horizontal band ~40% down the viewport decides the active section.
      rootMargin: '-38% 0px -57% 0px',
    });
    this.observer.observe(el);
  }

  unregister(el: Element): void {
    this.sections.delete(el);
    this.inBand.delete(el);
    this.observer?.unobserve(el);
    this.recompute();
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.inBand.add(entry.target);
      } else {
        this.inBand.delete(entry.target);
      }
    }
    this.recompute();
  }

  private recompute(): void {
    let active: string | null = null;
    for (const [el, id] of this.sections) {
      if (this.inBand.has(el)) {
        active = id;
      }
    }
    this.activeId.set(active);
  }
}

/**
 * Marks an element as a spy-tracked section and gives it a matching DOM id,
 * so `appSection="about"` is both the anchor target and the nav-active key.
 */
@Directive({
  selector: '[appSection]',
  host: { '[id]': 'appSection()' },
})
export class Section implements OnInit, OnDestroy {
  private readonly spy = inject(ScrollSpy);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appSection = input.required<string>();

  ngOnInit(): void {
    this.spy.register(this.el.nativeElement, this.appSection());
  }

  ngOnDestroy(): void {
    this.spy.unregister(this.el.nativeElement);
  }
}
