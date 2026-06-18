import { auth, currentUser } from "@clerk/nextjs/server"

import { getLiveblocks, getUserColor } from "@/lib/liveblocks"
import { getProjectWithAccess } from "@/lib/project-access"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { room: roomId } = await request.json()

  const project = await getProjectWithAccess(roomId)
  if (!project) {
    return new Response("Forbidden", { status: 403 })
  }

  const user = await currentUser()
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Anonymous"
  const name = displayName
  const avatar = user?.imageUrl ?? ""
  const color = getUserColor(userId)

  const lb = getLiveblocks()

  await lb.getOrCreateRoom(roomId, { defaultAccesses: ["room:write"] })

  const { status, body } = await lb.identifyUser(
    { userId, groupIds: [] },
    { userInfo: { name, avatar, color } }
  )

  return new Response(body, { status })
}
