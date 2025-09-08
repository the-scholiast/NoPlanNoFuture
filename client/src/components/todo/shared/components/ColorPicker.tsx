import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  /** 'auto' = follow current theme; 'light' | 'dark' = force palette */
  paletteMode?: 'auto' | 'light' | 'dark';
}

const LIGHT_COLORS = [
  '#a5c4dd', '#a7d3b2', '#e2c897', '#e7b8a2', '#d6a7a7', '#c0add9',
  '#bfa8b6', '#a7c9c2', '#d3b8a7', '#a7b2d3', '#b0b8c2', '#c2d3a7',
];

const DARK_COLORS = [
  '#2f4a6d', '#2f5d47', '#6e5125', '#6e3c25', '#652b2b', '#46356e',
  '#5e3447', '#333b47', '#275550', '#5c4326', '#3e2f5c', '#2f3a5c',
];

export function ColorPicker({ value, onChange, disabled, paletteMode = 'auto' }: ColorPickerProps) {
  const { theme, resolvedTheme } = useTheme();
  const isDarkTheme = (theme === 'dark') || (theme === 'system' && resolvedTheme === 'dark');

  const palette = useMemo(() => {
    if (paletteMode === 'light') return LIGHT_COLORS;
    if (paletteMode === 'dark') return DARK_COLORS;
    return isDarkTheme ? DARK_COLORS : LIGHT_COLORS;
  }, [paletteMode, isDarkTheme]);

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">task color</Label>
      <div className="grid grid-cols-6 gap-2">
        {palette.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${value === color
                ? 'border-gray-800 dark:border-gray-200 ring-2 ring-offset-2 ring-gray-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            style={{ backgroundColor: color }}
            onClick={() => !disabled && onChange(color)}
            disabled={disabled}
            title={color}
            aria-label={`Pick ${color}`}
          />
        ))}
      </div>
      {value && (
        <div className="mt-2 text-xs text-muted-foreground">
          color selected: <span className="font-mono">{value}</span>
        </div>
      )}
    </div>
  );
}
