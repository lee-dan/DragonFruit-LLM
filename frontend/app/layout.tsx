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
  title: "DragonFruit - LLM Stress Testing Platform",
  description: "Comprehensive LLM stress testing and robustness evaluation platform",
  keywords: ["LLM", "AI", "testing", "robustness", "hallucination detection"],
  authors: [{ name: "DragonFruit Team" }],
  creator: "DragonFruit Team",
  openGraph: {
    title: "DragonFruit - LLM Stress Testing Platform",
    description: "Comprehensive LLM stress testing and robustness evaluation platform",
    type: "website",
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon_io/favicon.ico',
    apple: '/favicon_io/apple-touch-icon.png',
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