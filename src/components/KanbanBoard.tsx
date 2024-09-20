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

export function KanbanBoard(): JSX.Element {
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
    const newColumns: ColumnsType = {
      "To Do": { id: "To Do", list: [] },
      "In Progress": { id: "In Progress", list: [] },
      "Completed": { id: "Completed", list: [] },
    };

    tasks.forEach((task) => {
      if (newColumns[task.status]) {
        // Only add the task if it's not already in any column
        if (!Object.values(newColumns).some(column => 
          column.list.some(existingTask => existingTask.id === task.id)
        )) {
          newColumns[task.status].list.push(task);
        }
      }
    });

    setColumns(newColumns);
  }, [tasks]);

  const handleDragStart = (event:{ active: { id: string }}) => {
    const { active } = event;
    setActiveId(active.id);
    const task = Object.values(columns).flatMap(column => column.list).find(task => task.id === activeId);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: { active: { id: string }, over: { id: string } | null }): void => {
    const { active, over } = event;
    
    if (!over) {
      setOverColumnId(null);
      return;
    }

    // Check if over a column
    const overColumn = Object.keys(columns).find(columnId => columnId === over.id);
    if (overColumn) {
      setOverColumnId(overColumn);
      return;
    }

    // If not over a column, find the column containing the task
    const overTask = Object.values(columns).flatMap(column => column.list).find(task => task.id === over.id);
    if (overTask) {
      const overColumnId = Object.keys(columns).find(columnId => 
        columns[columnId].list.some(task => task.id === over.id)
      );
      setOverColumnId(overColumnId || null);
    }
  };

  const handleDragEnd = async (event: { active: { id: string }, over: { id: string } | null }): Promise<void> => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);
    setOverColumnId(null);

    if (!over) return; // No valid drop

    const activeTask = Object.values(columns).flatMap(column => column.list).find(task => task.id === active.id);
    if (!activeTask) return;

    const fromColumn = Object.keys(columns).find(columnId => 
      columns[columnId].list.some(task => task.id === active.id)
    );
    const toColumn = over.id in columns ? over.id : Object.keys(columns).find(columnId => 
      columns[columnId].list.some(task => task.id === over.id)
    );

    if (!fromColumn || !toColumn) return;

    const newColumns = { ...columns };

    // Remove the task from the source column
    newColumns[fromColumn].list = newColumns[fromColumn].list.filter(task => task.id !== active.id);

    // Add the task to the destination column, ensuring it's not already there
    if (!newColumns[toColumn].list.some(task => task.id === active.id)) {
      const insertIndex = over.id in columns ? 0 : newColumns[toColumn].list.findIndex(task => task.id === over.id);
      newColumns[toColumn].list.splice(insertIndex, 0, { ...activeTask, status: toColumn });
    }

    setColumns(newColumns);

    // Update task status in the context and database
    await updateTask(activeTask.id, { status: toColumn });
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
