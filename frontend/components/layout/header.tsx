"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Moon,
  PlusCircle,
  Sun,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { CreateTestRunForm } from "@/components/forms/create-test-run-form"

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/runs", label: "Test Runs" },
  { href: "/analytics", label: "Analytics" },
  { href: "/models", label: "Models" },
  { href: "/business-rules", label: "Business Rules" },
  { href: "/hallucinations", label: "Hallucinations (Beta)" }
]

function ThemeToggle() {
    const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full"
    >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Zap className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">FailProof</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === href ? "text-foreground" : "text-foreground/60",
                  "rounded-md px-3 py-2",
                  pathname === href && "bg-primary/10 text-primary",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Can add search bar back here if needed */}
          </div>
          <CreateTestRunForm />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt="@failproof" />
                  <AvatarFallback>FP</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    FailProof
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    team@failproof.io
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
