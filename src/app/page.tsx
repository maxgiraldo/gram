import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <Layout>
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Gram
        </h1>
        <p className="text-xl text-gray-600">
          Interactive Grammar Learning Made Simple
        </p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Start Learning
          </h2>
          <p className="text-gray-600 mb-4">
            Begin your grammar journey with interactive lessons designed to
            make learning engaging and effective.
          </p>
          <a href="/lessons">
            <Button variant="primary" size="lg">
              Begin Lessons
            </Button>
          </a>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Track Progress
          </h2>
          <p className="text-gray-600 mb-4">
            Monitor your learning progress and see how far you&apos;ve come in
            mastering grammar concepts.
          </p>
          <a href="/progress">
            <Button variant="success" size="lg">
              View Progress
            </Button>
          </a>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h3 className="text-2xl font-semibold text-gray-800 mb-8">
          Why Choose Gram?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Interactive Lessons
            </h4>
            <p className="text-gray-600">
              Engage with dynamic content that adapts to your learning style.
            </p>
          </Card>
          <Card className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Targeted Practice
            </h4>
            <p className="text-gray-600">
              Focus on specific grammar areas that need improvement.
            </p>
          </Card>
          <Card className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Progress Tracking
            </h4>
            <p className="text-gray-600">
              See your improvement over time with detailed analytics.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
