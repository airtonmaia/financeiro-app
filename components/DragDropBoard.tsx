'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Project = {
    id: string;
    descricao: string;
    data_entrega: string | null | undefined;
    status_entrega: string;
    task_groups?: any[];
};

type Status = {
    id: string;
    name: string;
    color: string;
};

type BoardProps = {
    projects: Project[];
    statuses: Status[];
    onOpenProject?: (id: string) => void;
    onEditProject?: (id: string) => void;
    onMoveProject?: (project: Project) => void;
    onDeleteProject?: (id: string) => void;
    onDragEnd?: (result: DropResult) => void;
};

export function DragDropBoard({ 
    projects,
    statuses,
    onOpenProject,
    onEditProject,
    onMoveProject,
    onDeleteProject,
    onDragEnd = () => { /* no-op */ }
}: BoardProps) {

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {statuses.map((status) => (
                    <Droppable key={status.id} droppableId={status.name}>
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="bg-card rounded-lg shadow p-4"
                                style={{ 
                                    borderTop: "3px solid " + status.color
                                }}
                            >
                                <h3 className="font-semibold mb-4">{status.name}</h3>
                                <div className="space-y-4">
                                    {projects
                                        .filter(project => project.status_entrega === status.name)
                                        .map((project, index) => (
                                            <Draggable
                                                key={project.id}
                                                draggableId={project.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "rounded-lg border bg-card text-card-foreground shadow-sm",
                                                            "p-4 space-y-2",
                                                            snapshot.isDragging && "ring-2 ring-primary"
                                                        )}
                                                        onClick={() => onOpenProject?.(project.id)}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-medium">{project.descricao}</h4>
                                                            {onEditProject && onMoveProject && onDeleteProject && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button onClick={(e) => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground">⋯</button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditProject(project.id); }}>Editar</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveProject(project); }}>Mover para...</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="text-destructive">Excluir</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>
                                                        {project.data_entrega && (
                                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                <span>
                                                                    {format(new Date(project.data_entrega), 'dd/MM/yyyy')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>
                ))}
            </div>
        </DragDropContext>
    );
}
