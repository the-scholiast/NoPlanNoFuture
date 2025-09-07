import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}


const COLOR_OPTIONS = [
    '#93b5cf', 
    '#7bbd8a', 
    '#d4b483', 
    '#e6a57e', 
    '#d08080', 
    '#b8a5d3', 
    '#d292b4', 
    '#9ca3af', 
    '#6faea6', 
    '#c2a96b', 
    '#a96d6d', 
    '#8d85c1', 
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
