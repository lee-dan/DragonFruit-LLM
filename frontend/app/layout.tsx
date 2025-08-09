import type { Metadata } from "next"
import { IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "FailProof - LLM Stress Testing Platform",
  description:
    "Enterprise-grade LLM stress testing with adversarial inputs and failure detection",
  keywords: ["LLM", "testing", "hallucination", "AI", "enterprise"],
  authors: [{ name: "FailProof Team" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ibmPlexMono.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}