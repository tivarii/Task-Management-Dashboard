import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]/route'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Task Management Dashboard</CardTitle>
          <CardDescription className="text-center">Organize your tasks efficiently</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">
            Welcome to your personal task management solution. Keep track of your tasks, organize them with a Kanban board, and boost your productivity.
          </p>
          {session ? (
            <p className="text-center text-green-600 font-semibold">
              You are signed in as {session.user.email}
            </p>
          ) : (
            <p className="text-center text-gray-600">
              Sign in to start managing your tasks
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          {session ? (
            <>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/api/auth/signout">Sign Out</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}