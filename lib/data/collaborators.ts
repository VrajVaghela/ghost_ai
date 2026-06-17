import { clerkClient } from "@clerk/nextjs/server"

export interface Collaborator {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

interface CollaboratorRow {
  id: string
  email: string
}

export async function enrichCollaborators(
  rows: CollaboratorRow[]
): Promise<Collaborator[]> {
  if (rows.length === 0) return []

  const emails = rows.map((row) => row.email)
  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({
    emailAddress: emails,
    limit: Math.min(emails.length, 100),
  })

  const byEmail = new Map<string, (typeof users)[number]>()
  for (const user of users) {
    for (const address of user.emailAddresses) {
      byEmail.set(address.emailAddress.toLowerCase(), user)
    }
  }

  return rows.map((row) => {
    const user = byEmail.get(row.email.toLowerCase())
    if (!user) {
      return { id: row.id, email: row.email, name: null, imageUrl: null }
    }

    const name =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      null

    return { id: row.id, email: row.email, name, imageUrl: user.imageUrl ?? null }
  })
}
