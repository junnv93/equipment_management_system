"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 overflow-hidden rounded-full transition-all duration-300 hover:bg-accent/80 hover:text-accent-foreground"
        >
          <Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[160px] overflow-hidden rounded-md border border-border bg-background/95 p-1 backdrop-blur-md transition-all dark:bg-gray-900/95"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
            theme === "light" ? "bg-accent/50 font-medium" : ""
          }`}
        >
          <Sun className="h-4 w-4" />
          <span>밝은 모드</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
            theme === "dark" ? "bg-accent/50 font-medium" : ""
          }`}
        >
          <Moon className="h-4 w-4" />
          <span>어두운 모드</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
            theme === "system" ? "bg-accent/50 font-medium" : ""
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-4 w-4"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>시스템 설정</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 