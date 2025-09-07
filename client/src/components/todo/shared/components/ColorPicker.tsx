import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}


const COLOR_OPTIONS = [
  '#a5c4dd', 
  '#a7d3b2', 
  '#e2c897', 
  '#e7b8a2', 
  '#d6a7a7', 
  '#c0add9', 
  '#bfa8b6', 
  '#a7c9c2', 
  '#d3b8a7', 
  '#a7b2d3', 
  '#b0b8c2', 
  '#c2d3a7', 
];

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">task color</Label>
      <div className="grid grid-cols-6 gap-2">
        {COLOR_OPTIONS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
              value === color 
                ? 'border-gray-800 dark:border-gray-200 ring-2 ring-offset-2 ring-gray-400' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => !disabled && onChange(color)}
            disabled={disabled}
            title={color}
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
