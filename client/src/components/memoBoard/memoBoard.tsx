'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface Memo {
    id: string;
    content: string;
    timestamp: Date;
    color: string;
    x: number;
    y: number;
}

const MEMO_COLORS = [
    '#FFE066', '#FF9A9E', '#A8E6CF', '#FFB3BA', '#BFEFFF',
    '#E6E6FA', '#F0E68C', '#DDA0DD', '#98FB98', '#F5DEB3',
];

const InteractiveMemoBoard: React.FC = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [memos, setMemos] = useState<Memo[]>([]);
    const [newMemo, setNewMemo] = useState('');
    const [selectedColor, setSelectedColor] = useState(MEMO_COLORS[0]);
    const [draggedMemo, setDraggedMemo] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const boardRef = useRef<HTMLDivElement>(null);

    const createMemo = () => {
        if (!newMemo.trim()) return;

        const memo: Memo = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            content: newMemo.trim(),
            timestamp: new Date(),
            color: selectedColor,
            x: Math.random() * 300 + 50,
            y: Math.random() * 200 + 50
        };

        setMemos(prev => [...prev, memo]);
        setNewMemo('');
    };

    const deleteMemo = (id: string) => {
        setMemos(prev => prev.filter(memo => memo.id !== id));
    };

    const handleMouseDown = (e: React.MouseEvent, memoId: string) => {
        const memo = memos.find(m => m.id === memoId);
        if (!memo) return;

        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggedMemo(memoId);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedMemo || !boardRef.current) return;

        const boardRect = boardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left - dragOffset.x;
        const y = e.clientY - boardRect.top - dragOffset.y;

        setMemos(prev => prev.map(memo =>
            memo.id === draggedMemo
                ? {
                    ...memo,
                    x: Math.max(0, Math.min(x, boardRect.width - 150)),
                    y: Math.max(0, Math.min(y, boardRect.height - 150))
                }
                : memo
        ));
    };

    const handleMouseUp = () => {
        setDraggedMemo(null);
        setDragOffset({ x: 0, y: 0 });
    };

    return (
        <div className="min-h-screen">
            <div className="text-center py-6">
                <h1
                    className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}
                >
                    Memo Board
                </h1>
            </div>

            <div
                ref={boardRef}
                className="relative mx-auto mb-6 bg-white border-10 border-gray-400 shadow-lg"
                style={{
                    width: '800px',
                    height: '500px',
                    borderRadius: '6px'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {memos.map((memo) => (
                    <div
                        key={memo.id}
                        className={`absolute p-3 shadow-md border border-black/20 cursor-move select-none group transform hover:scale-105 transition-transform ${draggedMemo === memo.id ? 'scale-110 shadow-2xl z-50' : 'hover:shadow-xl'
                            }`}
                        style={{
                            backgroundColor: memo.color,
                            left: memo.x,
                            top: memo.y,
                            width: '150px',
                            height: '150px',
                            zIndex: draggedMemo === memo.id ? 1000 : 1,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                            overflow: 'hidden',
                            boxSizing: 'border-box'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, memo.id)}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteMemo(memo.id);
                            }}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 text-xs flex items-center justify-center transition-opacity"
                            style={{ borderRadius: '0px' }}
                        >
                            ✕
                        </button>


                        <div className="text-gray-800 text-sm leading-relaxed break-words overflow-hidden">
                            {memo.content}
                        </div>
                    </div>
                ))}
            </div>

            <div className="max-w-md mx-auto p-4 m-4">
                <div
                    className="w-48 h-32 p-3 shadow-md border border-black/10 mx-auto mb-4"
                    style={{ backgroundColor: selectedColor }}
                >
                    <textarea
                        value={newMemo}
                        onChange={(e) => setNewMemo(e.target.value)}
                        placeholder="Type here..."
                        className="w-full h-full bg-transparent border-none outline-none resize-none text-sm text-gray-800 placeholder-gray-500"
                        maxLength={200}
                    />
                </div>

                <div className="flex justify-center mb-4">
                    {MEMO_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-4 h-4 mx-1 border-2 hover:scale-125 transition-transform ${selectedColor === color ? 'border-gray-800 scale-125' : 'border-gray-300'
                                }`}
                            style={{
                                backgroundColor: color,
                                borderRadius: '0px'
                            }}
                        />
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={createMemo}
                        disabled={!newMemo.trim()}
                        className={`px-6 py-2 font-semibold transition-colors ${isDarkMode
                                ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                        style={{ borderRadius: '0px' }}
                    >
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InteractiveMemoBoard;
