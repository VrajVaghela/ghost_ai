export interface Project {
  id: string
  name: string
  slug: string
  owned: boolean
}

export const mockProjects: Project[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", owned: true },
  { id: "2", name: "User Auth Service", slug: "user-auth-service", owned: true },
  { id: "3", name: "Analytics Dashboard", slug: "analytics-dashboard", owned: false },
]
