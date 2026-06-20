import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProjectCard from './ProjectCard';

const SortableProjectCard = ({ project, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: project._id,
        data: { type: 'Project', project },
        disabled: project.myRole !== 'OWNER' && project.myRole !== 'ADMIN'
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.2 : 1,
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={project.myRole !== 'OWNER' && project.myRole !== 'ADMIN' ? '' : 'cursor-grab active:cursor-grabbing'}
        >
            <ProjectCard project={project} isDragging={isDragging} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
};

export default SortableProjectCard;
