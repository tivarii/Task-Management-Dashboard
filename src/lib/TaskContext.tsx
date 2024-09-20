"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Task } from "@prisma/client"

type TaskContextType = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, "id" | "userId">) => Promise<void>
  updateTask: (id: string, task: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks()
    }
  }, [status])
  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (response.ok) {
        const fetchedTasks = await response.json()
        setTasks(fetchedTasks)
      } else {
        console.error("Failed to fetch tasks")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const addTask = async (task: Omit<Task, "id" | "userId">) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      })
      if (response.ok) {
        const newTask = await response.json()
        setTasks(prevTasks => [...prevTasks, newTask])
      } else {
        console.error("Failed to add task")
      }
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      })
      if (response.ok) {
        const updated = await response.json()
        setTasks(prevTasks => prevTasks.map((task) => (task.id === id ? updated : task)))
      } else {
        console.error("Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      if (response.ok) {
        setTasks(prevTasks => prevTasks.filter((task) => task.id !== id))
      } else {
        console.error("Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider")
  }
  return context
}