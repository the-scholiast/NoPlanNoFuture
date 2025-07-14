'use client'
import { useState } from "react";
import YearPicker from "@/components/year";
export default function Page() {
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <div>
      <label htmlFor="year" className="block mb-1 font-medium">Select Year</label>
      <YearPicker value={year} onChange={setYear} />
      <p className="mt-2">Selected year: {year}</p>
    </div>
  );
}
