
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    // Toggle between light and dark only (no system option)
    setTheme(theme === "dark" ? "light" : "dark")
  }
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="relative overflow-hidden transition-all duration-500"
    >
      {/* Sun icon - visible in light mode, rotates out in dark mode */}
      <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out 
                     rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      
      {/* Moon icon - visible in dark mode, rotates in from light mode */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out 
                     rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
