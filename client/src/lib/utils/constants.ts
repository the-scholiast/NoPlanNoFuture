export const DAYS_OF_WEEK = [
  'sunday', 
  'monday', 
  'tuesday', 
  'wednesday', 
  'thursday', 
  'friday', 
  'saturday',
] as const; // Create literal types of a tuple instead of string[]

export type DayOfWeek = typeof DAYS_OF_WEEK[number]; // Get the type of any element in this array (the date names)

export const DAY_ABBREVIATIONS: Record<DayOfWeek, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};