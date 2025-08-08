'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabaseClient';

interface Memo {
    id: number;
    content: string;
    timestamp: string;
    color: string;
    x: number;
    y: number;
    last_updated: string;
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
    const [draggedMemo, setDraggedMemo] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const boardRef = useRef<HTMLDivElement>(null);

    /** Fetch all memos from the database */
    const fetchMemos = async () => {
        const { data, error } = await supabase
            .from('memos')
            .select('*')
            .order('last_updated', { ascending: true, nullsFirst: false }) // newest first, NULLs last
            .order('id', { ascending: false }); // tie-breaker

        setMemos((data || []).map(m => ({
            ...m,
            x: Number(m.x),
            y: Number(m.y)
        })));


        if (error) {
            console.error('Error fetching memos:', error);
            return;
        }
        setMemos(data || []);
    };

    /** Create a new memo and save it to the database */
    const createMemo = async () => {
        if (!newMemo.trim()) return;

        const insertData = {
            content: newMemo.trim(),
            color: selectedColor,
            x: Math.random() * 300 + 50,
            y: Math.random() * 200 + 50,
            last_updated: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('memos')
            .insert([insertData])
            .select();

        if (error) {
            console.error('Error inserting memo:', error);
            return;
        }

        if (!error && data) {
            // Move the new memo to the end (top)
            setMemos(prev => [...prev.filter(m => m.id !== data[0].id), data[0]]);
            setNewMemo('');
        }

    };

    /** Delete a memo from the database */
    const deleteMemo = async (id: number) => {
        const { error } = await supabase.from('memos').delete().eq('id', id);
        if (error) {
            console.error('Error deleting memo:', error);
            return;
        }
        setMemos(prev => prev.filter(memo => memo.id !== id));
    };

    /** Update memo position in the database */
    const updateMemoPosition = async (id: number, x: number, y: number) => {
        const { error } = await supabase
            .from('memos')
            .update({ x, y, last_updated: new Date().toISOString() })
            .eq('id', id);
        if (error) {
            console.error('Error updating memo position:', error);
        }
    };

    const handleMouseDown = (e: React.MouseEvent, memoId: number) => {
        const memo = memos.find(m => m.id === memoId);
        if (!memo) return;

        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggedMemo(memoId);

        // Bring this memo to the end (top)
        setMemos(prev => {
            const target = prev.find(m => m.id === memoId)!;
            const others = prev.filter(m => m.id !== memoId);
            return [...others, target];
        });
    };


    /** Handle mouse move event for dragging */
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

    /** Handle mouse up event to stop dragging and save position */
    const handleMouseUp = () => {
        if (draggedMemo !== null) {
            const memo = memos.find(m => m.id === draggedMemo);
            if (memo) {
                // Save new position to database
                updateMemoPosition(memo.id, memo.x, memo.y);

                // Keep it visually on top immediately
                setMemos(prev => {
                    const target = prev.find(m => m.id === memo.id)!;
                    const others = prev.filter(m => m.id !== memo.id);
                    return [...others, target];
                });
            }
        }
        setDraggedMemo(null);
        setDragOffset({ x: 0, y: 0 });
    };



    /** Load memos on component mount */
    useEffect(() => {
        fetchMemos();
    }, []);

    return (
        <div className="min-h-screen">
            <div className="text-center pb-6">
                <h1
                    className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}
                >
                    Memo Board
                </h1>
            </div>

            {/* Memo Board Area */}
            <div
                ref={boardRef}
                className="relative mx-auto bg-white border-10 border-gray-400 shadow-lg"
                style={{
                    width: '1000px',
                    height: '600px',
                    borderRadius: '6px'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {memos.map((memo) => (
                    <div
                        key={memo.id}
                        className={`absolute p-3 shadow-md border border-black/20 cursor-move select-none group transform hover:scale-105 transition-transform ${draggedMemo === memo.id
                                ? 'scale-110 shadow-2xl z-50'
                                : 'hover:shadow-xl'
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
                        {/* Delete button */}
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

                        {/* Memo text */}
                        <div className="text-gray-800 text-sm leading-relaxed break-words overflow-hidden">
                            {memo.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Memo Area */}
            <div className="max-w-md mx-auto p-4 m-4">
                {/* Memo preview box */}
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

                {/* Color picker */}
                <div className="flex justify-center mb-4">
                    {MEMO_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-4 h-4 mx-1 border-2 hover:scale-125 transition-transform ${selectedColor === color
                                    ? 'border-gray-800 scale-125'
                                    : 'border-gray-300'
                                }`}
                            style={{
                                backgroundColor: color,
                                borderRadius: '0px'
                            }}
                        />
                    ))}
                </div>

                {/* Create button */}
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
