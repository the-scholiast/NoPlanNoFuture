'use client';
import React, { useState } from 'react';

interface Task {
    title: string;
    start: number;
    end: number;
    remarks: string;
    hourGroup: 'AM' | 'PM';
    displayRing?: 'inner' | 'outer';
}

const RadialPlanner: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [formVisible, setFormVisible] = useState<boolean>(false);
    const [newTask, setNewTask] = useState<Task>({ title: '', start: 0, end: 1, remarks: '', hourGroup: 'AM' });
    const [startTime, setStartTime] = useState<string>("12:00");
    const [endTime, setEndTime] = useState<string>("1:00");
    const [timeError, setTimeError] = useState<string>("");

    const validateTimeString = (timeStr: string): boolean => {
        // Allow single digit hours (1-12) and proper HH:MM format
        const timeRegex = /^(1[0-2]|[1-9])(:([0-5][0-9]))?$/;
        return timeRegex.test(timeStr);
    };

    const parseTimeString = (timeStr: string): number => {
        if (!validateTimeString(timeStr)) {
            return 0;
        }

        // Handle cases like "2" -> "2:00"
        const parts = timeStr.includes(':') ? timeStr.split(':') : [timeStr, '0'];
        const [hourStr, minuteStr] = parts;
        const hour = parseInt(hourStr);
        const minute = parseInt(minuteStr) || 0;
        return (hour === 12 ? 0 : hour) + minute / 60;
    };

    const validateTimes = (): boolean => {
        setTimeError("");

        if (!validateTimeString(startTime)) {
            setTimeError("Start time must be 1-12 (e.g., 9 or 9:30)");
            return false;
        }

        if (!validateTimeString(endTime)) {
            setTimeError("End time must be 1-12 (e.g., 10 or 10:30)");
            return false;
        }

        const start = parseTimeString(startTime);
        const end = parseTimeString(endTime);

        if (newTask.hourGroup === 'PM' && end <= start) {
            setTimeError("End time must be after start time for PM tasks");
            return false;
        }

        // For AM tasks, allow cross-period (e.g., 11 AM to 1 PM)
        return true;
    };

    const formatTimeInput = (input: string): string => {
        // Remove all non-digits and colons
        const cleaned = input.replace(/[^\d:]/g, '');

        // If it's just digits, handle auto-formatting
        if (!/[:]/g.test(cleaned)) {
            const digits = cleaned.replace(/\D/g, '');

            if (digits.length === 0) return '';
            if (digits.length === 1) return digits;
            if (digits.length === 2) {
                const hour = parseInt(digits);
                // If it's a valid hour (1-12), auto-add :00
                if (hour >= 1 && hour <= 12) {
                    return digits + ':00';
                }
                return digits;
            }
            if (digits.length === 3) return `${digits[0]}:${digits.slice(1)}`;
            if (digits.length >= 4) return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
        }

        return cleaned;
    };

    const handleTimeInput = (value: string, setter: (val: string) => void) => {
        const formatted = formatTimeInput(value);
        setter(formatted);
        setTimeError("");
    };

    const addTask = () => {
        if (!validateTimes() || !newTask.title.trim()) {
            return;
        }

        const taskToAdd = {
            ...newTask,
            start: parseTimeString(startTime),
            end: parseTimeString(endTime)
        };

        setTasks([...tasks, taskToAdd]);
        setNewTask({ title: '', start: 0, end: 1, remarks: '', hourGroup: 'AM' });
        setStartTime("12:00");
        setEndTime("1:00");
        setTimeError("");
        setFormVisible(false);
    };

    const outerRadius = 100;
    const innerRadius = 60;
    const center = 200;

    const getTimeColor = (hour: number, isAM: boolean) => {
        let actualHour = hour;
        if (!isAM) actualHour += 12;
        if (actualHour === 24) actualHour = 0;

        if (actualHour >= 5 && actualHour < 7) {
            return '#ff7b7b';
        } else if (actualHour >= 7 && actualHour < 11) {
            return '#87ceeb';
        } else if (actualHour >= 11 && actualHour < 17) {
            return '#ffd700';
        } else if (actualHour >= 17 && actualHour < 20) {
            return '#ff8c42';
        } else {
            return '#2e2e5f';
        }
    };

    const getOptimalTextPosition = (startAngle: number, endAngle: number, radius: number, isInnerRing: boolean) => {
        let midAngle = (startAngle + endAngle) / 2;

        // For tasks that cross the 11-1 position (around -π/2 to π/2), adjust text position
        const span = Math.abs(endAngle - startAngle);

        // If the task spans across the top (12 o'clock position), move text away from center
        if (span > Math.PI) {
            // For large spans, place text at the bottom of the arc
            midAngle = midAngle + Math.PI;
        } else if (midAngle > -Math.PI / 3 && midAngle < Math.PI / 3) {
            // For tasks near 12 o'clock, move text slightly outward
            const textRadius = isInnerRing ? radius * 0.7 : (radius + innerRadius) / 2 + 10;
            return {
                x: center + textRadius * Math.cos(midAngle),
                y: center + textRadius * Math.sin(midAngle),
                angle: midAngle
            };
        }

        const textRadius = isInnerRing ? radius * 0.5 : (radius + innerRadius) / 2;
        return {
            x: center + textRadius * Math.cos(midAngle),
            y: center + textRadius * Math.sin(midAngle),
            angle: midAngle
        };
    };

    const renderCrossPeriodTask = (task: Task, index: number) => {
        const offset = -Math.PI / 2;
        const originalIndex = tasks.findIndex(t => t === task);

        const amPortion = {
            start: task.start,
            end: 12,
            ring: 'outer'
        };

        const pmPortion = {
            start: 0,
            end: task.end,
            ring: 'inner'
        };

        const portions = [amPortion, pmPortion];
        const elements = [];

        portions.forEach((portion, portionIndex) => {
            const isInnerRing = portion.ring === 'inner';
            const duration = Math.abs(portion.end - portion.start);

            const startAngle = (portion.start / 12) * 2 * Math.PI + offset;
            const endAngle = (portion.end / 12) * 2 * Math.PI + offset;

            const radiusExtension = Math.max(0, (duration - 1) * 8);
            const baseRadius = isInnerRing ? innerRadius : outerRadius;
            const radius = baseRadius + radiusExtension;

            const x1 = center;
            const y1 = center;
            const x2 = center + radius * Math.cos(startAngle);
            const y2 = center + radius * Math.sin(startAngle);
            const x3 = center + radius * Math.cos(endAngle);
            const y3 = center + radius * Math.sin(endAngle);

            const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

            let pathData;
            if (isInnerRing) {
                pathData = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} Z`;
            } else {
                const innerX2 = center + innerRadius * Math.cos(startAngle);
                const innerY2 = center + innerRadius * Math.sin(startAngle);
                const innerX3 = center + innerRadius * Math.cos(endAngle);
                const innerY3 = center + innerRadius * Math.sin(endAngle);

                pathData = `M${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} L${innerX3},${innerY3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerX2},${innerY2} Z`;
            }

            const textPos = getOptimalTextPosition(startAngle, endAngle, radius, isInnerRing);
            const avgTime = (portion.start + portion.end) / 2;
            const colorTimeGroup = portionIndex === 0 ? 'AM' : 'PM';
            const taskColor = getTimeColor(avgTime, colorTimeGroup === 'AM');

            elements.push(
                <g key={`cross-task-${originalIndex}-${portionIndex}`}>
                    <path
                        d={pathData}
                        fill={taskColor}
                        strokeWidth={0}
                        opacity="1.0"
                    />
                    <text
                        x={textPos.x}
                        y={textPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="white"
                        fontWeight="bold"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)', cursor: 'default' }}
                    >
                        {task.title}
                    </text>
                </g>
            );
        });

        const connectionAngle = 0 + offset;
        const outerConnectionX = center + outerRadius * Math.cos(connectionAngle);
        const outerConnectionY = center + outerRadius * Math.sin(connectionAngle);
        const innerConnectionX = center + innerRadius * Math.cos(connectionAngle);
        const innerConnectionY = center + innerRadius * Math.sin(connectionAngle);

        elements.push(
            <line
                key={`connection-${originalIndex}`}
                x1={outerConnectionX}
                y1={outerConnectionY}
                x2={innerConnectionX}
                y2={innerConnectionY}
                stroke="white"
                strokeWidth="2"
                opacity="0.8"
            />
        );

        return elements;
    };

    const renderTasks = () => {
        const elements: React.ReactElement[] = [];


        const sortedTasks = [...tasks].sort((a, b) => {
            const aRing = a.hourGroup === 'AM' ? 'outer' : 'inner';
            const bRing = b.hourGroup === 'AM' ? 'outer' : 'inner';

            if (aRing !== bRing) {
                return aRing === 'outer' ? -1 : 1;
            }

            const durationA = getTaskDuration(a);
            const durationB = getTaskDuration(b);
            return durationB - durationA;
        });

        sortedTasks.forEach((task, index) => {
            const isCrossPeriod = task.hourGroup === 'AM' && task.end < task.start;

            if (isCrossPeriod) {
                elements.push(...renderCrossPeriodTask(task, index));
                return;
            }

            const useRing = task.hourGroup === 'AM' ? 'outer' : 'inner';
            const isInnerRing = useRing === 'inner';

            const offset = -Math.PI / 2;

            let startHour = task.start;
            let endHour = task.end;

            const duration = Math.abs(endHour - startHour);
            const startAngle = (startHour / 12) * 2 * Math.PI + offset;
            const endAngle = (endHour / 12) * 2 * Math.PI + offset;

            const radiusExtension = Math.max(0, (duration - 1) * 8);
            const baseRadius = isInnerRing ? innerRadius : outerRadius;
            const radius = baseRadius + radiusExtension;

            const x1 = center;
            const y1 = center;
            const x2 = center + radius * Math.cos(startAngle);
            const y2 = center + radius * Math.sin(startAngle);
            const x3 = center + radius * Math.cos(endAngle);
            const y3 = center + radius * Math.sin(endAngle);

            const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

            let pathData;
            if (isInnerRing) {
                pathData = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} Z`;
            } else {
                const innerX2 = center + innerRadius * Math.cos(startAngle);
                const innerY2 = center + innerRadius * Math.sin(startAngle);
                const innerX3 = center + innerRadius * Math.cos(endAngle);
                const innerY3 = center + innerRadius * Math.sin(endAngle);

                pathData = `M${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} L${innerX3},${innerY3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerX2},${innerY2} Z`;
            }

            const textPos = getOptimalTextPosition(startAngle, endAngle, radius, isInnerRing);
            const originalIndex = tasks.findIndex(t => t === task);
            const avgTime = (startHour + endHour) / 2;
            const colorTimeGroup = task.hourGroup;
            const taskColor = getTimeColor(avgTime, colorTimeGroup === 'AM');

            // Determine font size based on task duration
            const fontSize = duration > 2 ? 11 : duration > 1 ? 10 : 9;

            elements.push(
                <g key={`task-${originalIndex}`}>
                    <path
                        d={pathData}
                        fill={taskColor}
                        strokeWidth={0}
                        opacity="1.0"
                    />
                    <text
                        x={textPos.x}
                        y={textPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fontSize}
                        fill="white"
                        fontWeight="bold"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)', cursor: 'default' }}
                    >
                        {task.title}
                    </text>
                </g>
            );
        });

        return elements;
    };

    const renderTimeMarks = () => {
        const marks = [];
        const offset = -Math.PI / 2;

        for (let i = 0; i < 24; i++) {
            const angle = (i / 12) * Math.PI + offset;
            const isHourMark = i % 2 === 0;

            const markLength = isHourMark ? 15 : 8;
            const strokeWidth = isHourMark ? 2 : 1;

            const outerX = center + outerRadius * Math.cos(angle);
            const outerY = center + outerRadius * Math.sin(angle);
            const innerX = center + (outerRadius - markLength) * Math.cos(angle);
            const innerY = center + (outerRadius - markLength) * Math.sin(angle);

            marks.push(
                <line
                    key={`outer-mark-${i}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="white"
                    strokeWidth={strokeWidth}
                    opacity="0.7"
                />
            );
        }

        return marks;
    };

    const renderInnerHourMarks = () => {
        const marks = [];
        const offset = -Math.PI / 2;

        for (let i = 0; i < 12; i++) {
            const angle = (i / 6) * Math.PI + offset;

            const markLength = 12;
            const strokeWidth = 1.5;

            const outerX = center + innerRadius * Math.cos(angle);
            const outerY = center + innerRadius * Math.sin(angle);
            const innerX = center + (innerRadius - markLength) * Math.cos(angle);
            const innerY = center + (innerRadius - markLength) * Math.sin(angle);

            marks.push(
                <line
                    key={`inner-hour-mark-${i}`}
                    x1={outerX}
                    y1={outerY}
                    x2={innerX}
                    y2={innerY}
                    stroke="white"
                    strokeWidth={strokeWidth}
                    opacity="0.9"
                />
            );
        }

        return marks;
    };

    const renderClockNumbers = () => {
        const numbers = [];
        const offset = -Math.PI / 2;

        const maxTaskRadius = Math.max(
            outerRadius + Math.max(...tasks.filter(t => t.hourGroup === 'AM').map(t => {
                const duration = getTaskDuration(t);
                return Math.max(0, (duration - 1) * 8);
            }), 0),
            innerRadius + Math.max(...tasks.filter(t => t.hourGroup === 'PM').map(t => {
                const duration = getTaskDuration(t);
                return Math.max(0, (duration - 1) * 8);
            }), 0)
        );
        const numberRadius = maxTaskRadius + 30;

        for (let hour = 1; hour <= 12; hour++) {
            const angle = ((hour === 12 ? 0 : hour) / 12) * 2 * Math.PI + offset;
            const x = center + numberRadius * Math.cos(angle);
            const y = center + numberRadius * Math.sin(angle);

            numbers.push(
                <text
                    key={hour}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fill="white"
                    fontWeight="bold"
                >
                    {hour}
                </text>
            );
        }
        return numbers;
    };

    const deleteTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const formatTime = (timeValue: number, hourGroup: string) => {
        const hours = Math.floor(timeValue);
        const minutes = Math.round((timeValue % 1) * 60);
        const displayHour = hours === 0 ? 12 : hours;
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${hourGroup}`;
    };

    const getTaskDuration = (task: Task) => {
        if (task.hourGroup === 'AM' && task.end < task.start) {
            return (12 - task.start) + task.end;
        }
        return Math.abs(task.end - task.start);
    };

    const isCrossPeriodTask = (startTime: string, endTime: string, hourGroup: string) => {
        const start = parseTimeString(startTime);
        const end = parseTimeString(endTime);
        return hourGroup === 'AM' && end < start;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-6">Radial Day Planner</h1>

            <button
                className="bg-blue-500 px-6 py-3 rounded-lg hover:bg-blue-600 mb-6 text-lg font-semibold transition-colors"
                onClick={() => setFormVisible(true)}
            >
                Add Task
            </button>

            {formVisible && (
                <div className="bg-white text-black p-6 rounded-lg shadow-lg mb-6 w-96">
                    <h3 className="text-lg font-bold mb-4">Add New Task</h3>

                    <label className="block mb-2 font-semibold">Title</label>
                    <input
                        type="text"
                        className="w-full border px-3 py-2 mb-3 rounded"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Enter task title"
                    />

                    <label className="block mb-2 font-semibold">Time Period</label>
                    <select
                        className="w-full border px-3 py-2 mb-3 rounded"
                        value={newTask.hourGroup}
                        onChange={(e) => setNewTask({ ...newTask, hourGroup: e.target.value as 'AM' | 'PM' })}
                    >
                        <option value="AM">AM (Morning)</option>
                        <option value="PM">PM (Afternoon/Evening)</option>
                    </select>

                    <div className="flex gap-3 mb-3">
                        <div className="flex-1">
                            <label className="block mb-2 font-semibold">Start Time</label>
                            <input
                                type="text"
                                className="w-full border px-3 py-2 rounded"
                                value={startTime}
                                onChange={(e) => handleTimeInput(e.target.value, setStartTime)}
                                placeholder="9 or 9:30"
                            />
                            <small className="text-gray-600">Format: H or H:MM (1-12)</small>
                        </div>
                        <div className="flex-1">
                            <label className="block mb-2 font-semibold">End Time</label>
                            <input
                                type="text"
                                className="w-full border px-3 py-2 rounded"
                                value={endTime}
                                onChange={(e) => handleTimeInput(e.target.value, setEndTime)}
                                placeholder="10 or 10:30"
                            />
                            <small className="text-gray-600">Format: H or H:MM (1-12)</small>
                        </div>
                    </div>

                    {timeError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
                            {timeError}
                        </div>
                    )}

                    <label className="block mb-2 font-semibold">Notes</label>
                    <textarea
                        className="w-full border px-3 py-2 mb-4 rounded"
                        rows={3}
                        value={newTask.remarks}
                        onChange={(e) => setNewTask({ ...newTask, remarks: e.target.value })}
                        placeholder="Optional notes about this task"
                    />

                    <div className="flex justify-between gap-3">
                        <button
                            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white font-semibold flex-1 transition-colors disabled:bg-gray-400"
                            onClick={addTask}
                            disabled={!newTask.title.trim()}
                        >
                            Add Task
                        </button>
                        <button
                            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white font-semibold flex-1 transition-colors"
                            onClick={() => {
                                setFormVisible(false);
                                setTimeError("");
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row items-start gap-8">
                <svg width="400" height="400" className="bg-gray-800 rounded-full shadow-lg" viewBox="0 0 400 400">
                    <circle cx="200" cy="200" r={outerRadius} fill="#4a5568" stroke="#2d3748" strokeWidth="2" />
                    <circle cx="200" cy="200" r={innerRadius} fill="#2d3748" stroke="#1a202c" strokeWidth="2" />
                    <circle cx="200" cy="200" r="4" fill="#e2e8f0" />
                    {renderTasks()}
                    {renderTimeMarks()}
                    {renderInnerHourMarks()}
                    {renderClockNumbers()}
                </svg>

                {tasks.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg min-w-[500px]">
                        <h3 className="text-lg font-bold mb-3">Tasks</h3>
                        <div className="space-y-1">
                            {tasks.map((task, index) => (
                                <div key={index} className="bg-gray-700 p-3 rounded flex items-center hover:bg-gray-600 transition-colors">
                                    <div
                                        className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                        style={{ backgroundColor: getTimeColor((task.start + task.end) / 2, task.hourGroup === 'AM') }}
                                    />
                                    <div className="flex-shrink-0 w-32 text-sm font-medium">
                                        {formatTime(task.start, task.hourGroup)}
                                    </div>
                                    <div className="flex-shrink-0 w-32 text-sm font-medium">
                                        {task.end < task.start && task.hourGroup === 'AM' ?
                                            formatTime(task.end, 'PM') :
                                            formatTime(task.end, task.hourGroup)
                                        }
                                    </div>
                                    <div className="font-medium flex-1 min-w-0 mx-3" title={task.title}>
                                        {task.title}
                                    </div>
                                    {task.remarks && (
                                        <div className="text-sm text-gray-400 flex-1 min-w-0 mx-3" title={task.remarks}>
                                            {task.remarks}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => deleteTask(index)}
                                        className="text-red-400 hover:text-red-300 ml-3 flex-shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RadialPlanner;