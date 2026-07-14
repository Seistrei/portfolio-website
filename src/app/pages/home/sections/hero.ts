import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../components/icon';
import { Reveal } from '../../../core/reveal';
import { PROFILE } from '../../../data/profile';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, Icon, Reveal],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly profile = PROFILE;
}
