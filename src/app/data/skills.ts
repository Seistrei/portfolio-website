export interface SkillGroup {
  readonly title: string;
  readonly skills: readonly string[];
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    title: 'Languages',
    skills: ['TypeScript', 'JavaScript', 'Java', 'Python', 'SQL', 'C++', 'C#'],
  },
  {
    title: 'Frontend',
    skills: ['Angular', 'Signals & zoneless', 'RxJS', 'React', 'HTML', 'SCSS'],
  },
  {
    title: 'Backend & Data',
    skills: [
      'Node.js',
      'REST APIs',
      'PostgreSQL',
      'MongoDB',
      'SQLite',
      'WebSockets',
      'NATS',
      'FastAPI',
    ],
  },
  {
    title: 'Testing & DevOps',
    skills: ['Docker', 'GitLab CI/CD', 'Git', 'Jest', 'Vitest', 'pytest'],
  },
  {
    title: 'AI & LLM Systems',
    skills: [
      'Claude & OpenAI APIs',
      'Tool calling',
      'Context compaction',
      'Prompt caching',
      'Autonomous agents',
      'Vector memory',
    ],
  },
];
