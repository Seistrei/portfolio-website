import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

/**
 * Themes are named for the two moons of "Memory's Hourglass":
 * Rikt, the red lightmoon (light), and Rim, the darkmoon (dark).
 */
export type ThemeName = 'rikt' | 'rim';

const STORAGE_KEY = 'hr-theme';

/**
 * Theme state. The initial value is whatever the pre-boot script in
 * index.html stamped on <html data-theme>, so there is never a flash.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);

  readonly current = signal<ThemeName>(
    this.document.documentElement.dataset['theme'] === 'rikt' ? 'rikt' : 'rim',
  );
  readonly isDark = () => this.current() === 'rim';

  constructor() {
    effect(() => {
      const theme = this.current();
      this.document.documentElement.dataset['theme'] = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Storage can be unavailable (private mode); the theme still applies.
      }
    });
  }

  toggle(): void {
    this.current.update((t) => (t === 'rim' ? 'rikt' : 'rim'));
  }
}
