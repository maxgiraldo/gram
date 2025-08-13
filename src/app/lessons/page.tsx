import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LessonsPage() {
  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grammar Lessons</h1>
        <p className="text-gray-600">Choose a topic to start learning</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Sentence Structure</h3>
          <p className="text-gray-600 mb-4">Learn about subjects, predicates, and sentence types.</p>
          <Button variant="primary" size="md" className="w-full">
            Start Lesson
          </Button>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🔤</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Parts of Speech</h3>
          <p className="text-gray-600 mb-4">Master nouns, verbs, adjectives, and more.</p>
          <Button variant="success" size="md" className="w-full">
            Start Lesson
          </Button>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">⏰</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Verb Tenses</h3>
          <p className="text-gray-600 mb-4">Understand past, present, and future tenses.</p>
          <Button variant="primary" size="md" className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500">
            Start Lesson
          </Button>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Punctuation</h3>
          <p className="text-gray-600 mb-4">Perfect your use of commas, periods, and more.</p>
          <Button variant="primary" size="md" className="w-full bg-orange-600 hover:bg-orange-700 focus:ring-orange-500">
            Start Lesson
          </Button>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">📖</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Reading Comprehension</h3>
          <p className="text-gray-600 mb-4">Improve understanding of written text.</p>
          <Button variant="danger" size="md" className="w-full">
            Start Lesson
          </Button>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">✍️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Writing Skills</h3>
          <p className="text-gray-600 mb-4">Develop clear and effective writing.</p>
          <Button variant="primary" size="md" className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
            Start Lesson
          </Button>
        </Card>
      </div>
    </Layout>
  );
}