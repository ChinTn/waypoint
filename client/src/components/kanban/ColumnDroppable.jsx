import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const ColumnDroppable = ({ column, taskCount, onHeaderClick, children }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: { type: 'Column', column }
    });

    return (
        <div ref={setNodeRef} className="flex-1 min-w-0 bg-slate-100/50 dark:bg-neutral-950/20 backdrop-blur-xl border border-slate-200 dark:border-white/5 flex flex-col rounded-[2rem] overflow-hidden shadow-sm dark:shadow-2xl">
            <div 
                onClick={onHeaderClick}
                className={`p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex justify-between items-center relative overflow-hidden ${onHeaderClick ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group' : ''}`}
            >
                {column.color && <div className={`absolute top-0 left-0 w-full h-1 border-t-2 ${column.color}`}></div>}
                <h3 className={`font-sans text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-white ${onHeaderClick ? 'group-hover:text-[#3b82f6] transition-colors' : ''}`}>{column.title}</h3>
                <span className="text-sm font-bold bg-white dark:bg-white/10 px-3 py-1 rounded-full text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-inner">
                    {taskCount}
                </span>
            </div>
            {children}
        </div>
    );
};

export default ColumnDroppable;
