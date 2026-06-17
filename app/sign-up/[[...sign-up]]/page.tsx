import { SignUp } from "@clerk/nextjs"

import { AuthLeftPanel } from "@/components/auth/auth-left-panel"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-bg-base">
        <SignUp />
      </div>
    </div>
  )
}
