"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/ui/themes"

import { ThemeProvider, useTheme } from "@/components/theme/theme-provider"

const clerkVariables = {
  colorBackground: "var(--bg-base)",
  colorInput: "var(--bg-elevated)",
  colorForeground: "var(--text-primary)",
  colorMutedForeground: "var(--text-secondary)",
  colorPrimary: "var(--accent-primary)",
  colorDanger: "var(--state-error)",
  borderRadius: "var(--radius)",
}

function ClerkWithTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <ClerkProvider
      appearance={{
        theme: theme === "dark" ? dark : undefined,
        variables: clerkVariables,
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkWithTheme>{children}</ClerkWithTheme>
    </ThemeProvider>
  )
}
