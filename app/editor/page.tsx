import { EditorHomeClient } from "@/components/editor/editor-home-client"
import { getOwnedProjects, getSharedProjects } from "@/lib/data/projects"

export default async function EditorPage() {
  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ])

  return <EditorHomeClient ownedProjects={ownedProjects} sharedProjects={sharedProjects} />
}
