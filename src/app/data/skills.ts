export interface SkillGroup {
  readonly title: string;
  readonly skills: readonly string[];
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    title: 'Languages',
    skills: ['TypeScript', 'Python', 'JavaScript', 'Java'],
  },
  {
    title: 'Frontend',
    skills: ['Angular', 'Signals & zoneless', 'RxJS', 'React', 'HTML', 'SCSS'],
  },
  {
    title: 'Python & AI',
    skills: [
      'FastAPI',
      'Pydantic',
      'pytest',
      'asyncio',
      'LLM APIs',
      'Tool calling',
      'Agent orchestration',
      'Context management',
      'Memory systems',
    ],
  },
  {
    title: 'Backend & Data',
    skills: ['NATS', 'Node.js', 'PostgreSQL', 'MongoDB', 'SQLite', 'REST APIs', 'WebSockets'],
  },
  {
    title: 'Testing & DevOps',
    skills: ['Docker', 'GitHub Actions', 'GitLab CI/CD', 'Git', 'Jest', 'Vitest'],
  },
];
