import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProgressPage() {
  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">Track your grammar learning journey</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Lessons Completed</span>
                  <span className="text-sm text-gray-500">12/24</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '50%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Exercises Completed</span>
                  <span className="text-sm text-gray-500">45/60</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Accuracy Rate</span>
                  <span className="text-sm text-gray-500">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '87%'}}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Completed: Verb Tenses Exercise</p>
                  <p className="text-xs text-gray-500">2 hours ago • Score: 9/10</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📚</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Started: Punctuation Lesson</p>
                  <p className="text-xs text-gray-500">Yesterday • In Progress</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">🎯</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Achievement: Grammar Novice</p>
                  <p className="text-xs text-gray-500">3 days ago • Complete 10 lessons</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">7</div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">142</div>
                <div className="text-sm text-gray-500">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">12</div>
                <div className="text-sm text-gray-500">Badges Earned</div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weak Areas</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Comma Usage</span>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">65%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Subject-Verb Agreement</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">72%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Apostrophes</span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">78%</span>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="primary" size="sm" className="w-full">
                Practice Weak Areas
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}