import type { Metadata, Viewport } from "next"
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
  title: "Lightscale",
  description: "Comprehensive LLM stress testing and robustness evaluation platform",
  keywords: ["LLM", "AI", "testing", "robustness", "hallucination detection"],
  authors: [{ name: "Lightscale Team" }],
  creator: "Lightscale Team",
  openGraph: {
    title: "Lightscale",
    description: "Comprehensive LLM stress testing and robustness evaluation platform",
    type: "website",
  },
  icons: {
    icon: '/icononly_transparent.png',
    shortcut: '/icononly_transparent.png',
    apple: '/icononly_transparent.png',
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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