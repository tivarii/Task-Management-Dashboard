"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/lib/TaskContext";
import { Task } from "@prisma/client";
import { SortableItem } from "./SortableItem";

type ColumnType = {
  id: string;
  list: Task[];
};

type ColumnsType = {
  [key: string]: ColumnType;
};

const initialColumns: ColumnsType = {
  "To Do": {
    id: "To Do",
    list: [],
  },
  "In Progress": {
    id: "In Progress",
    list: [],
  },
  Completed: {
    id: "Completed",
    list: [],
  },
};

export function KanbanBoard() {
  const { tasks, updateTask } = useTaskContext();
  const [columns, setColumns] = useState<ColumnsType>(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const newColumns = { ...initialColumns };
    const uniqueTitles = new Set<string>(); // Set to track unique titles
    tasks.forEach((task) => {
      if (newColumns[task.status] && !uniqueTitles.has(task.title)) {
        newColumns[task.status].list.push(task);
        uniqueTitles.add(task.title); // Add title to set
      }
    });
    setColumns(newColumns);
  }, [tasks]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    const task = Object.values(columns).flatMap(column => column.list).find(task => task.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (over) {
      const overId = over.id;
      const overColumn = Object.entries(columns).find(([, column]) => column.list.some(task => task.id === overId));
      if (overColumn) {
        setOverColumnId(overColumn[0]);
      }
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);
    setOverColumnId(null);

    if (!over || active.id === over.id) return; // No valid drop

    const activeColumn = Object.values(columns).find(column => column.list.some(task => task.id === active.id));
    const overColumn = Object.values(columns).find(column => column.list.some(task => task.id === over.id));

    if (activeColumn && overColumn) {
      const activeColumnId = activeColumn.id;
      const overColumnId = overColumn.id;

      const activeIndex = activeColumn.list.findIndex(task => task.id === active.id);
      const overIndex = overColumn.list.length > 0 ? overColumn.list.findIndex(task => task.id === over.id) : 0; // Drop at the start if the target is empty

      const newColumns = { ...columns };

      if (activeColumnId === overColumnId) {
        newColumns[activeColumnId].list = arrayMove(newColumns[activeColumnId].list, activeIndex, overIndex);
      } else {
        const [movedTask] = newColumns[activeColumnId].list.splice(activeIndex, 1);
        movedTask.status = overColumnId;
        if (!newColumns[overColumnId].list.some(task => task.title === movedTask.title)) { // Check for unique title
          newColumns[overColumnId].list.splice(overIndex, 0, movedTask);

          // Update task status in the context and database
          await updateTask(movedTask.id, { status: overColumnId });
        } else {
          console.error(`Task with title "${movedTask.title}" already exists in the "${overColumnId}" column.`);
        }
      }

      setColumns(newColumns);
    }
  };

  const renderTask = (task: Task) => (
    <Card className="mb-2 p-2">
      <CardTitle className="text-sm">{task.title}</CardTitle>
      <p className="text-xs text-gray-500">{task.description}</p>
      <div className="flex justify-between items-center mt-2">
        <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
          {task.priority}
        </Badge>
        <span className="text-xs text-gray-500">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
        </span>
      </div>
    </Card>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {Object.entries(columns).map(([columnId, column]) => (
          <div key={`column-${columnId}`} className="w-full md:w-1/3">
            <Card className={overColumnId === columnId ? 'border-2 border-blue-500' : ''}>
              <CardHeader>
                <CardTitle>{columnId}</CardTitle>
              </CardHeader>
              <CardContent>
                <SortableContext items={column.list.map(task => task.id)} strategy={verticalListSortingStrategy}>
                  <div className="min-h-[500px]">
                    {column.list.map((task: Task) => (
                      <SortableItem key={`task-${task.id}`} id={task.id}>
                        {renderTask(task)}
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? renderTask(activeTask) : null}
      </DragOverlay>
    </DndContext>
  );
}
