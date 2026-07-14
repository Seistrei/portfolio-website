import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { projectBySlug } from './data/projects';
import { Home } from './pages/home/home';

/** Redirects unknown project slugs home instead of rendering an empty page. */
const projectExists: CanActivateFn = (route) =>
  projectBySlug(route.paramMap.get('slug') ?? '') ? true : inject(Router).createUrlTree(['/']);

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Heath Rohlman · Software Engineer',
  },
  {
    path: 'projects/:slug',
    canActivate: [projectExists],
    loadComponent: () =>
      import('./pages/project-detail/project-detail').then((m) => m.ProjectDetail),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
