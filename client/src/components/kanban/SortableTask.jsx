import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTask = ({ task, myRole, updateTaskPriority, onOpenDetails }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { type: 'Task', task }
  });

  const handlePriorityClick = (e) => {
    e.stopPropagation();
    if (myRole === 'OWNER' || myRole === 'ADMIN') {
        const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const nextIndex = (priorities.indexOf(task.priority) + 1) % priorities.length;
        updateTaskPriority(task._id, priorities[nextIndex]);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'none', // DISABLED to eliminate the artificial 250ms visual delay
    opacity: isDragging ? 0.2 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (e.target.closest('[data-no-click]')) return;
        onOpenDetails(task._id);
      }}
      className={`bg-white dark:bg-white/5 backdrop-blur-md border p-4 cursor-grab active:cursor-grabbing shadow-sm dark:shadow-lg z-10 rounded-[1rem] ${isDragging ? 'border-[#3b82f6] shadow-[0_0_30px_rgba(255,90,0,0.2)]' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/10 hover:-translate-y-1'}`}
    >
      <h4 className="text-sm font-semibold mb-3 text-neutral-900 dark:text-white">{task.title}</h4>
      <div className="flex justify-between items-center mt-1 pt-3 border-t border-slate-100 dark:border-white/5">
        <span 
          data-no-click="true"
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={handlePriorityClick}
          className={`text-[10px] font-bold font-sans uppercase tracking-widest px-2.5 py-1 rounded-full border ${(myRole === 'OWNER' || myRole === 'ADMIN') ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${task.priority === 'URGENT' ? 'border-red-500 text-red-100 bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : task.priority === 'HIGH' ? 'border-red-500/50 text-red-400 bg-red-500/10' : task.priority === 'MEDIUM' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' : 'border-green-500/50 text-green-400 bg-green-500/10'}`}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
};

export default SortableTask;
