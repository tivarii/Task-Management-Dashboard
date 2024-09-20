// src/components/SignUpForm.tsx
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function SignUpForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        toast({
          title: "Account created successfully",
          description: "Please sign in with your new account.",
          duration: 5000,
        })
        
        // Attempt to sign in immediately after successful signup
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        })

        if (result?.ok) {
          router.push("/dashboard")
        } else {
          router.push("/auth/signin")
        }
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">Sign Up</Button>
    </form>
  )
}