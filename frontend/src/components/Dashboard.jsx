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
    } else {
      // Set some default demo stats if none exist
      const demoStats = {
        totalRepos: 3,
        analyzedFiles: 42,
        improvements: 18,
        lastAnalysis: new Date().toISOString()
      }
      setStats(demoStats)
      localStorage.setItem('dashboardStats', JSON.stringify(demoStats))
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
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <MobileHeader setSidebarOpen={setSidebarOpen} title="Dashboard" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome to your AI Code Assistant</p>
              </div>
              <div className="hidden sm:block">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl">🤖</div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Warning */}
          {!githubToken && (
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <CardTitle className="text-amber-800">Setup Required</CardTitle>
                    <CardDescription className="text-amber-700">
                      Please configure your GitHub token in Settings to get started with repository analysis.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => window.location.href = '/settings'}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Go to Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Repositories</CardTitle>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalRepos}</div>
                <p className="text-sm text-gray-600 mt-1">Connected repositories</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Analyzed Files</CardTitle>
                <div className="bg-green-50 p-2 rounded-lg">
                  <Code className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.analyzedFiles}</div>
                <p className="text-sm text-gray-600 mt-1">Files processed</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Improvements</CardTitle>
                <div className="bg-purple-50 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.improvements}</div>
                <p className="text-sm text-gray-600 mt-1">Suggestions made</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Last Analysis</CardTitle>
                <div className="bg-orange-50 p-2 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.lastAnalysis ? new Date(stats.lastAnalysis).toLocaleDateString() : 'Never'}
                </div>
                <p className="text-sm text-gray-600 mt-1">Most recent</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-blue-300"
                onClick={action.action}
              >
                <CardHeader className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <action.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">{action.title}</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-600">Your latest code analysis activities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.lastAnalysis ? (
                  <>
                    <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Code analysis completed</p>
                        <p className="text-xs text-gray-600">{new Date(stats.lastAnalysis).toLocaleString()}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{stats.improvements} improvements suggested</p>
                        <p className="text-xs text-gray-600">AI-powered code enhancements</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">AI</Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Start analyzing code to see your activity here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

