// Shared Discord utility functions
export const postToDiscord = async (webhookUrl, tasks) => {
  // Group tasks by actual dates
  const tasksByDate = {};
  const today = new Date();
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  tasks.forEach(task => {
    if (task.start_date) {
      // Regular dated task
      const taskDate = new Date(task.start_date);
      const dateKey = formatDate(taskDate);
      
      // Only include tasks within the next week
      if (taskDate >= today && taskDate <= oneWeekFromNow) {
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        tasksByDate[dateKey].push({
          ...task,
          type: 'dated',
          displayDate: dateKey
        });
      }
    } else if (task.is_recurring && task.recurring_days) {
      // Recurring task - calculate next occurrence for each recurring day within the next week
      task.recurring_days.forEach(dayNumber => {
        const nextDate = getNextOccurrence(dayNumber);
        
        // Only include if within the next week
        if (nextDate <= oneWeekFromNow) {
          const dateKey = formatDate(nextDate);
          if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
          }
          tasksByDate[dateKey].push({
            ...task,
            type: 'recurring',
            displayDate: dateKey
          });
        }
      });
    } else if (task.section === 'daily') {
      // Daily task - calculate next occurrence for each day of the week within the next week
      for (let i = 1; i <= 7; i++) {
        const nextDate = getNextOccurrence(i);
        
        // Only include if within the next week
        if (nextDate <= oneWeekFromNow) {
          const dateKey = formatDate(nextDate);
          if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
          }
          tasksByDate[dateKey].push({
            ...task,
            type: 'daily',
            displayDate: dateKey
          });
        }
      }
    } else {
      // No date task - only include if it's a general task without specific timing
      const dateKey = 'No Date';
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push({
        ...task,
        type: 'no-date',
        displayDate: 'No Date'
      });
    }
  });

  // Sort dates from nearest to farthest
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    
    // Sort actual dates
    return new Date(a) - new Date(b);
  });

  // Calculate date range for title
  const dateRange = calculateDateRange(sortedDates);

  // Build text message
  let messageContent = `📅 **Your Tasks for the Next Week${dateRange}**\n\n`;
  
  if (sortedDates.length === 0) {
    messageContent += 'No tasks match your notification criteria.';
  } else {
    sortedDates.forEach(dateKey => {
      const tasksForDate = tasksByDate[dateKey];
      if (tasksForDate.length > 0) {
        messageContent += `**📅 ${dateKey}**\n`;
        
        tasksForDate.forEach(task => {
          const priority = task.priority ? ` [${task.priority}]` : '';
          const timeInfo = getTimeInfo(task);
          const typeInfo = getTypeInfo(task);
          messageContent += `• ${task.title}${priority}${timeInfo}${typeInfo}\n`;
        });
        
        messageContent += '\n';
      }
    });
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: messageContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
  }

  return response;
};

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get next occurrence of a day of the week
const getNextOccurrence = (dayNumber) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert to our day numbering (1 = Monday, 7 = Sunday)
  const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;
  
  let daysToAdd = dayNumber - adjustedCurrentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Next week
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate;
};

// Helper function to get time information
const getTimeInfo = (task) => {
  let timeInfo = '';
  
  if (task.start_time) {
    const formattedStartTime = formatTime(task.start_time);
    timeInfo += ` ${formattedStartTime}`;
  }
  
  if (task.end_time) {
    const formattedEndTime = formatTime(task.end_time);
    timeInfo += `-${formattedEndTime}`;
  }
  
  return timeInfo;
};

// Helper function to format time to show only hours and minutes
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // If time is already in HH:MM format, return as is
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // If time is in HH:MM:SS format, extract HH:MM
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
    return timeString.substring(0, 5);
  }
  
  // If time is in ISO format or other format, try to parse it
  try {
    const date = new Date(`2000-01-01T${timeString}`);
    if (!isNaN(date.getTime())) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch (e) {
    // If parsing fails, return original string
  }
  
  return timeString;
};

// Helper function to get type information
const getTypeInfo = (task) => {
  if (task.type === 'daily') {
    return ' (Daily)';
  } else if (task.type === 'recurring') {
    return ' (Recurring)';
  }
  return '';
};

// Helper function to calculate date range
const calculateDateRange = (sortedDates) => {
  // Get all dates excluding 'No Date'
  const allDates = sortedDates.filter(date => date !== 'No Date');

  if (allDates.length === 0) {
    return '';
  }

  if (allDates.length === 1) {
    return ` (${allDates[0]})`;
  }

  const startDate = allDates[0];
  const endDate = allDates[allDates.length - 1];
  
  if (startDate === endDate) {
    return ` (${startDate})`;
  }

  return ` (${startDate} - ${endDate})`;
};
