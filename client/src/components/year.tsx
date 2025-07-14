import React from "react";

interface YearPickerProps {
  value: number;
  onChange: (year: number) => void;
  startYear?: number;
  endYear?: number;
}

export default function YearPicker({
  value,
  onChange,
  startYear,
  endYear,
}: YearPickerProps) {
  const currentYear = new Date().getFullYear();
  const start = startYear ?? currentYear - 50;
  const end = endYear ?? currentYear + 5;

  const years = [];
  for (let y = end; y >= start; y--) {
    years.push(y);
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border rounded px-3 py-2 text-sm bg-white"
    >
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
