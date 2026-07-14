import { TestBed } from '@angular/core/testing';
import { Theme } from './theme';

describe('Theme', () => {
  afterEach(() => {
    localStorage.removeItem('hr-theme');
    delete document.documentElement.dataset['theme'];
  });

  it('reads the pre-boot theme from the document', () => {
    document.documentElement.dataset['theme'] = 'light';
    expect(TestBed.inject(Theme).current()).toBe('light');
  });

  it('toggles, stamps the document, and persists', () => {
    document.documentElement.dataset['theme'] = 'dark';
    const theme = TestBed.inject(Theme);
    expect(theme.current()).toBe('dark');

    theme.toggle();
    TestBed.tick(); // flush the sync effect

    expect(theme.current()).toBe('light');
    expect(theme.isDark()).toBe(false);
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('hr-theme')).toBe('light');
  });
});
