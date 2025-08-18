/**
 * Generates a complete day's worth of time slots in 30-minute increments
 * Creates 48 total slots (24 hours × 2 slots per hour)
 * Returns formatted time strings like "7:00 AM", "7:30 AM", etc.
 */

export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    // Add the hour slot
    const hourTime = hour === 0 ? "12:00 AM" :
      hour < 12 ? `${hour}:00 AM` :
        hour === 12 ? "12:00 PM" :
          `${hour - 12}:00 PM`;
    slots.push(hourTime);

    // Add the 30-minute slot
    if (hour < 24) {
      const halfHourTime = hour === 0 ? "12:30 AM" :
        hour < 12 ? `${hour}:30 AM` :
          hour === 12 ? "12:30 PM" :
            `${hour - 12}:30 PM`;
      slots.push(halfHourTime);
    }
  }
  return slots;
};

// Helper function to convert time slot to 24-hour format
export const convertTimeSlotTo24Hour = (timeSlot: string): string => {
  const [time, period] = timeSlot.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};