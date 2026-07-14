import { PROJECTS, projectBySlug } from './projects';

describe('projects data', () => {
  it('has unique slugs', () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has exactly one featured project', () => {
    expect(PROJECTS.filter((p) => p.featured).length).toBe(1);
  });

  it('resolves projects by slug', () => {
    for (const project of PROJECTS) {
      expect(projectBySlug(project.slug)).toBe(project);
    }
    expect(projectBySlug('does-not-exist')).toBeUndefined();
  });

  it('has complete detail-page content for every project', () => {
    for (const project of PROJECTS) {
      expect(project.overview.length).toBeGreaterThan(0);
      expect(project.highlights.length).toBeGreaterThan(0);
      expect(project.tech.length).toBeGreaterThan(0);
    }
  });
});
