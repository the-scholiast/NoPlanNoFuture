'use client';
import React, { useState } from 'react';

interface Task {
    title: string;
    start: number;
    end: number;
    remarks: string;
    hourGroup: 'AM' | 'PM';
    displayRing?: 'inner' | 'outer'; // For cross-period tasks
}

const RadialPlanner: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [formVisible, setFormVisible] = useState<boolean>(false);
    const [newTask, setNewTask] = useState<Task>({ title: '', start: 0, end: 1, remarks: '', hourGroup: 'AM', displayRing: 'outer' });
    const [startHour, setStartHour] = useState<number>(12);
    const [startMinute, setStartMinute] = useState<number>(0);
    const [endHour, setEndHour] = useState<number>(1);
    const [endMinute, setEndMinute] = useState<number>(0);

    const addTask = () => {
        const taskToAdd = {
            ...newTask,
            start: startHour === 12 ? 0 + startMinute / 60 : startHour + startMinute / 60,
            end: endHour === 12 ? 0 + endMinute / 60 : endHour + endMinute / 60
        };

        // Check if it's a cross-period task
        const isCrossPeriod = taskToAdd.start > taskToAdd.end && taskToAdd.hourGroup === 'AM';
        if (!isCrossPeriod) {
            taskToAdd.displayRing = undefined; // Reset for non-cross-period tasks
        }

        setTasks([...tasks, taskToAdd]);
        setNewTask({ title: '', start: 0, end: 1, remarks: '', hourGroup: 'AM', displayRing: 'outer' });
        setStartHour(12);
        setStartMinute(0);
        setEndHour(1);
        setEndMinute(0);
        setFormVisible(false);
    };

    const outerRadius = 100;
    const innerRadius = 60;
    const center = 200;

    // Get color based on time of day
    const getTimeColor = (hour: number, isAM: boolean) => {
        let actualHour = hour;
        if (!isAM) actualHour += 12;
        if (actualHour === 24) actualHour = 0;

        if (actualHour >= 5 && actualHour < 7) {
            // Dawn - orange/pink
            return '#ff7b7b';
        } else if (actualHour >= 7 && actualHour < 11) {
            // Morning - light blue/yellow
            return '#87ceeb';
        } else if (actualHour >= 11 && actualHour < 17) {
            // Day - bright blue/yellow
            return '#ffd700';
        } else if (actualHour >= 17 && actualHour < 20) {
            // Evening - orange/red
            return '#ff8c42';
        } else {
            // Night - dark blue/purple
            return '#2e2e5f';
        }
    };

    const renderCrossPeriodTask = (task: Task, index: number) => {
        const offset = -Math.PI / 2;
        const originalIndex = tasks.findIndex(t => t === task);

        // Split the task into AM and PM portions
        const amPortion = {
            start: task.start,
            end: 12, // End at 12:00 (which is 0 in our system, but represents 12:00)
            ring: 'outer'
        };

        const pmPortion = {
            start: 0, // Start at 12:00 (which is 0 in our system)
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
                // Inner ring: full pie slice from center
                pathData = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} Z`;
            } else {
                // Outer ring: arc (ring shape)
                const innerX2 = center + innerRadius * Math.cos(startAngle);
                const innerY2 = center + innerRadius * Math.sin(startAngle);
                const innerX3 = center + innerRadius * Math.cos(endAngle);
                const innerY3 = center + innerRadius * Math.sin(endAngle);

                pathData = `M${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} L${innerX3},${innerY3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerX2},${innerY2} Z`;
            }

            const midAngle = (startAngle + endAngle) / 2;
            const textRadius = isInnerRing ? radius * 0.5 : (radius + innerRadius) / 2;
            const textX = center + textRadius * Math.cos(midAngle);
            const textY = center + textRadius * Math.sin(midAngle);

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
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fill="white"
                        fontWeight="bold"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                    >
                        {task.title}
                    </text>
                </g>
            );
        });

        // Add connecting line for visual cue
        const connectionAngle = 0 + offset; // 12:00 position
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

        // Sort outer ring tasks first, then inner ring tasks (so inner can cover outer)
        const sortedTasks = [...tasks].sort((a, b) => {
            // Determine which ring each task should be on
            const aRing = a.displayRing || (a.hourGroup === 'AM' ? 'outer' : 'inner');
            const bRing = b.displayRing || (b.hourGroup === 'AM' ? 'outer' : 'inner');

            if (aRing !== bRing) {
                return aRing === 'outer' ? -1 : 1; // Outer ring tasks first
            }

            const durationA = getTaskDuration(a);
            const durationB = getTaskDuration(b);
            return durationB - durationA;
        });

        sortedTasks.forEach((task, index) => {
            // Check if this is a cross-period task
            const isCrossPeriod = task.hourGroup === 'AM' && task.end < task.start;

            if (isCrossPeriod) {
                elements.push(...renderCrossPeriodTask(task, index));
                return;
            }

            // Regular task rendering
            const useRing = task.displayRing || (task.hourGroup === 'AM' ? 'outer' : 'inner');
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
                // Inner ring: full pie slice from center
                pathData = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} Z`;
            } else {
                // Outer ring: arc (ring shape)
                const innerX2 = center + innerRadius * Math.cos(startAngle);
                const innerY2 = center + innerRadius * Math.sin(startAngle);
                const innerX3 = center + innerRadius * Math.cos(endAngle);
                const innerY3 = center + innerRadius * Math.sin(endAngle);

                pathData = `M${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} L${innerX3},${innerY3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerX2},${innerY2} Z`;
            }

            const midAngle = (startAngle + endAngle) / 2;
            const textRadius = isInnerRing ? radius * 0.5 : (radius + innerRadius) / 2;
            const textX = center + textRadius * Math.cos(midAngle);
            const textY = center + textRadius * Math.sin(midAngle);

            const originalIndex = tasks.findIndex(t => t === task);
            const avgTime = (startHour + endHour) / 2;
            const colorTimeGroup = task.hourGroup;
            const taskColor = getTimeColor(avgTime, colorTimeGroup === 'AM');

            elements.push(
                <g key={`task-${originalIndex}`}>
                    <path
                        d={pathData}
                        fill={taskColor}
                        strokeWidth={0}
                        opacity="1.0"
                    />
                    <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fill="white"
                        fontWeight="bold"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
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

        // Draw outer ring marks (thick lines and thin lines)
        for (let i = 0; i < 24; i++) { // 24 marks for both hour and half-hour
            const angle = (i / 12) * Math.PI + offset; // i/12 * 180 degrees
            const isHourMark = i % 2 === 0; // Even numbers are hour marks

            const markLength = isHourMark ? 15 : 8; // Hour marks longer than half-hour marks
            const strokeWidth = isHourMark ? 2 : 1; // Hour marks thicker (reduced from 3 to 2)

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

    // Render inner circle hour marks that appear on top of tasks
    const renderInnerHourMarks = () => {
        const marks = [];
        const offset = -Math.PI / 2;

        // Only draw hour marks (every 2nd mark, so 12 total)
        for (let i = 0; i < 12; i++) {
            const angle = (i / 6) * Math.PI + offset; // i/6 * 180 degrees (12 marks around circle)

            const markLength = 12; // Length of hour marks
            const strokeWidth = 1.5; // Thinner stroke width

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
        const displayPositions = [
            { hour: 12, angle: 0 },
            { hour: 3, angle: 3 },
            { hour: 6, angle: 6 },
            { hour: 9, angle: 9 }
        ];

        const maxTaskRadius = Math.max(
            outerRadius + Math.max(...tasks.filter(t => (t.displayRing || (t.hourGroup === 'AM' ? 'outer' : 'inner')) === 'outer').map(t => {
                const duration = getTaskDuration(t);
                return Math.max(0, (duration - 1) * 8);
            }), 0),
            innerRadius + Math.max(...tasks.filter(t => (t.displayRing || (t.hourGroup === 'AM' ? 'outer' : 'inner')) === 'inner').map(t => {
                const duration = getTaskDuration(t);
                return Math.max(0, (duration - 1) * 8);
            }), 0)
        );
        const numberRadius = maxTaskRadius + 30;

        for (let pos of displayPositions) {
            const angle = (pos.angle / 12) * 2 * Math.PI + offset;
            const x = center + numberRadius * Math.cos(angle);
            const y = center + numberRadius * Math.sin(angle);

            numbers.push(
                <text
                    key={pos.hour}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fill="white"
                    fontWeight="bold"
                >
                    {pos.hour}
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
        // Fix 12:00 display - when hours is 0, show 12
        const displayHour = hours === 0 ? 12 : hours;
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${hourGroup}`;
    };

    const getTaskDuration = (task: Task) => {
        if (task.hourGroup === 'AM' && task.end < task.start) {
            return (12 - task.start) + task.end;
        }
        return Math.abs(task.end - task.start);
    };

    const isCrossPeriodTask = (startHour: number, endHour: number, hourGroup: string) => {
        return hourGroup === 'AM' && endHour < startHour;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-6">Radial Day Planner</h1>

            <button
                className="bg-blue-500 px-6 py-3 rounded-lg hover:bg-blue-600 mb-6 text-lg font-semibold transition-colors"
                onClick={() => setFormVisible(true)}
            >
                Add task
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

                    {isCrossPeriodTask(
                        startHour === 12 ? 0 + startMinute / 60 : startHour + startMinute / 60,
                        endHour === 12 ? 0 + endMinute / 60 : endHour + endMinute / 60,
                        newTask.hourGroup
                    ) && (
                            <>
                                <label className="block mb-2 font-semibold">Display on Ring</label>
                                <select
                                    className="w-full border px-3 py-2 mb-3 rounded"
                                    value={newTask.displayRing}
                                    onChange={(e) => setNewTask({ ...newTask, displayRing: e.target.value as 'inner' | 'outer' })}
                                >
                                    <option value="outer">Outer Ring (Arc Shape)</option>
                                    <option value="inner">Inner Ring (Pie Shape)</option>
                                </select>
                            </>
                        )}

                    <div className="flex gap-3 mb-3">
                        <div className="flex-1">
                            <label className="block mb-2 font-semibold">Start Time</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 border px-3 py-2 rounded"
                                    value={startHour}
                                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const hour = i + 1;
                                        return (
                                            <option key={hour} value={hour === 12 ? 12 : hour}>
                                                {hour}
                                            </option>
                                        );
                                    })}
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    className="w-16 border px-2 py-2 rounded text-center"
                                    value={startMinute}
                                    onChange={(e) => setStartMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    placeholder="00"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block mb-2 font-semibold">End Time</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 border px-3 py-2 rounded"
                                    value={endHour}
                                    onChange={(e) => setEndHour(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const hour = i + 1;
                                        return (
                                            <option key={hour} value={hour === 12 ? 12 : hour}>
                                                {hour}
                                            </option>
                                        );
                                    })}
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    className="w-16 border px-2 py-2 rounded text-center"
                                    value={endMinute}
                                    onChange={(e) => setEndMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    placeholder="00"
                                />
                            </div>
                        </div>
                    </div>

                    <label className="block mb-2 font-semibold">Remarks</label>
                    <textarea
                        className="w-full border px-3 py-2 mb-4 rounded"
                        rows={3}
                        value={newTask.remarks}
                        onChange={(e) => setNewTask({ ...newTask, remarks: e.target.value })}
                        placeholder="Optional notes about this task"
                    />

                    <div className="flex justify-between gap-3">
                        <button
                            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white font-semibold flex-1 transition-colors"
                            onClick={addTask}
                            disabled={!newTask.title.trim()}
                        >
                            Add Task
                        </button>
                        <button
                            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white font-semibold flex-1 transition-colors"
                            onClick={() => setFormVisible(false)}
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
                    {renderTimeMarks()}
                    <circle cx="200" cy="200" r="4" fill="#e2e8f0" />
                    {renderTasks()}
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
                                    <div className="font-medium flex-1 min-w-0 mx-3">{task.title}</div>
                                    {task.remarks && (
                                        <div className="text-sm text-gray-400 flex-1 min-w-0 mx-3">{task.remarks}</div>
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