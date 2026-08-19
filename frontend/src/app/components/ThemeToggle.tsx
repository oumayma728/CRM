import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/40 transition-all duration-200 cursor-pointer active:scale-95"
      aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      <Sun className={`absolute w-4 h-4 text-foreground transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`absolute w-4 h-4 text-foreground transition-all duration-300 ${theme === 'light' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
    </button>
  );
}
