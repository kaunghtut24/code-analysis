import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Code, Clock, TrendingUp } from 'lucide-react'
import MobileHeader from './MobileHeader'

export default function Dashboard({ githubToken, setSidebarOpen }) {
  const [stats, setStats] = useState({
    totalRepos: 0,
    analyzedFiles: 0,
    improvements: 0,
    lastAnalysis: null
  })

  useEffect(() => {
    // Load stats from localStorage or API
    const savedStats = localStorage.getItem('dashboardStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  const quickActions = [
    {
      title: 'Analyze Repository',
      description: 'Select a repository to analyze its code quality',
      icon: Code,
      action: () => window.location.href = '/repositories'
    },
    {
      title: 'View Recent Analysis',
      description: 'Check your latest code analysis results',
      icon: Clock,
      action: () => window.location.href = '/analyzer'
    }
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MobileHeader setSidebarOpen={setSidebarOpen} title="Dashboard" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm sm:text-base">Welcome to your AI Code Assistant</p>
          </div>

      {!githubToken && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Setup Required</CardTitle>
            <CardDescription className="text-yellow-700">
              Please configure your GitHub token in Settings to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/settings'} variant="outline">
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRepos}</div>
            <p className="text-xs text-muted-foreground">Connected repositories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyzed Files</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analyzedFiles}</div>
            <p className="text-xs text-muted-foreground">Files processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.improvements}</div>
            <p className="text-xs text-muted-foreground">Suggestions made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Analysis</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastAnalysis ? new Date(stats.lastAnalysis).toLocaleDateString() : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">Most recent</p>
          </CardContent>
        </Card>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <action.icon className="h-6 w-6 text-blue-600" />
                <CardTitle>{action.title}</CardTitle>
              </div>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest code analysis activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.lastAnalysis ? (
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Code analysis completed</p>
                  <p className="text-xs text-gray-500">{new Date(stats.lastAnalysis).toLocaleString()}</p>
                </div>
                <Badge variant="secondary">Success</Badge>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

