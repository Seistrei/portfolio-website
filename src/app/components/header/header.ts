import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollSpy } from '../../core/scroll-spy';
import { Theme } from '../../core/theme';
import { PROFILE } from '../../data/profile';
import { Icon } from '../icon';

interface NavItem {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, Icon],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '(window:scroll)': 'onWindowScroll()',
    '(window:keydown.escape)': 'menuOpen.set(false)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly theme = inject(Theme);
  protected readonly spy = inject(ScrollSpy);

  protected readonly profile = PROFILE;
  protected readonly nav: readonly NavItem[] = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'contact', label: 'Contact' },
  ];

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  protected onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }
}
