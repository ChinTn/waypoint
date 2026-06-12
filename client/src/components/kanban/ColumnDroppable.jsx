import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const ColumnDroppable = ({ column, taskCount, onHeaderClick, children }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: { type: 'Column', column }
    });

    return (
        <div ref={setNodeRef} className="flex-1 min-w-0 bg-black/20 backdrop-blur-xl border border-white/5 flex flex-col rounded-[2rem] overflow-hidden shadow-2xl">
            <div 
                onClick={onHeaderClick}
                className={`p-6 border-b border-white/5 bg-white/5 flex justify-between items-center relative overflow-hidden ${onHeaderClick ? 'cursor-pointer hover:bg-white/10 transition-colors group' : ''}`}
            >
                {column.color && <div className={`absolute top-0 left-0 w-full h-1 border-t-2 ${column.color}`}></div>}
                <h3 className={`font-mono text-sm font-bold uppercase tracking-widest text-white ${onHeaderClick ? 'group-hover:text-[#3b82f6] transition-colors' : ''}`}>{column.title}</h3>
                <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full text-white border border-white/10 shadow-inner">
                    {taskCount}
                </span>
            </div>
            {children}
        </div>
    );
};

export default ColumnDroppable;
