import { TestBed } from '@angular/core/testing';
import { Theme } from './theme';

describe('Theme', () => {
  afterEach(() => {
    localStorage.removeItem('hr-theme');
    delete document.documentElement.dataset['theme'];
  });

  it('reads the pre-boot theme from the document', () => {
    document.documentElement.dataset['theme'] = 'rikt';
    expect(TestBed.inject(Theme).current()).toBe('rikt');
  });

  it('falls back to rim when the stamp is missing or unknown', () => {
    document.documentElement.dataset['theme'] = 'light';
    expect(TestBed.inject(Theme).current()).toBe('rim');
  });

  it('toggles, stamps the document, and persists', () => {
    document.documentElement.dataset['theme'] = 'rim';
    const theme = TestBed.inject(Theme);
    expect(theme.current()).toBe('rim');

    theme.toggle();
    TestBed.tick(); // flush the sync effect

    expect(theme.current()).toBe('rikt');
    expect(theme.isDark()).toBe(false);
    expect(document.documentElement.dataset['theme']).toBe('rikt');
    expect(localStorage.getItem('hr-theme')).toBe('rikt');
  });
});
