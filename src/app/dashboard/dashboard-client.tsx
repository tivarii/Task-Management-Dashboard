'use client'

import { KanbanBoard } from "@/components/KanbanBoard"
import { TaskList } from "@/components/TaskList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskContext } from "@/lib/TaskContext"

export function DashboardClient() {
  const { tasks, addTask, updateTask, deleteTask } = useTaskContext()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Task Management Dashboard</h1>
      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban">
          <KanbanBoard tasks={tasks} updateTask={updateTask} />
        </TabsContent>
        <TabsContent value="list">
          <TaskList tasks={tasks} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />
        </TabsContent>
      </Tabs>
    </div>
  )
}