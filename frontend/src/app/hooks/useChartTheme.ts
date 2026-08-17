import { useTheme } from '../contexts/ThemeContext';

export function useChartTheme() {
  const { theme } = useTheme();
  
  return {
    theme,
    textColor: theme === 'dark' ? '#ffffff' : '#475569',
    gridColor: theme === 'dark' ? '#334155' : '#e2e8f0',
    axisColor: theme === 'dark' ? '#ffffff' : '#475569',
    tooltipStyle: {
      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
      borderRadius: '8px',
      boxShadow: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    // Useful colors that adapt to theme
    colors: {
      primary: '#3b82f6',    // blue-500
      success: '#10b981',    // emerald-500
      warning: '#f59e0b',    // amber-500
      danger: '#ef4444',     // red-500
      purple: '#8b5cf6',     // violet-500
    }
  };
}
