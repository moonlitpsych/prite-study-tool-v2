import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  TrendingUp, 
  Target, 
  BarChart3,
  PieChart,
  Trophy,
  AlertCircle,
  Filter,
  Calendar,
  BookOpen,
  Zap
} from 'lucide-react';

type TimeRange = 'week' | 'month' | 'year' | 'all';
type ExamPart = 'Part 1' | 'Part 2';

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [examPart, setExamPart] = useState<ExamPart | undefined>();
  const [category, setCategory] = useState<string | undefined>();

  const { data: analytics, isLoading, error } = trpc.questions.getTopicAnalytics.useQuery({
    timeRange,
    examPart,
    category,
    limit: 25,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Analytics</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: 'year', label: 'Past Year' },
    { value: 'all', label: 'All Time' },
  ];

  const examPartOptions: { value: ExamPart; label: string }[] = [
    { value: 'Part 1', label: 'Part 1' },
    { value: 'Part 2', label: 'Part 2' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Topic Frequency Analytics</h1>
          <p className="text-muted-foreground">
            Discover high-yield topics and study patterns from the PRITE question bank
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Time Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <div className="flex gap-2">
                {timeRangeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={timeRange === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(option.value)}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Exam Part */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Part</label>
              <div className="flex gap-2">
                <Button
                  variant={!examPart ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExamPart(undefined)}
                >
                  All Parts
                </Button>
                {examPartOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={examPart === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExamPart(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics?.totalQuestions || 0}</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics?.totalTopics || 0}</div>
                <div className="text-sm text-muted-foreground">Unique Topics</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics?.highYieldTopics || 0}</div>
                <div className="text-sm text-muted-foreground">High-Yield Topics</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((analytics?.highYieldTopics || 0) / (analytics?.totalTopics || 1) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">High-Yield Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Frequency Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Top Topics by Frequency</span>
            </CardTitle>
            <CardDescription>
              Most frequently appearing topics across all PRITE questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topics.map((topic, index) => (
                <div key={topic.topic} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{topic.topic}</span>
                      {topic.highYield && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          High-Yield
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{topic.count} questions</div>
                      <div className="text-sm text-muted-foreground">{topic.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${topic.highYield ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Categories: {topic.categories.join(', ')}</span>
                    <span>Avg. studied: {topic.avgStudyCount}x</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Category Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.categoryDistribution.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exam Part Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Exam Part Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.examPartDistribution.map((part) => (
                <div key={part.examPart} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{part.examPart}</span>
                    <span className="text-sm font-bold">{part.count} questions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 bg-green-500 rounded-full"
                      style={{ width: `${part.percentage}%` }}
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {part.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>Study High-Yield</span>
            </CardTitle>
            <CardDescription>Focus on these frequent topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.recommendations.studyHighYield.map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <span className="text-xs text-yellow-700">{topic.count}q</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Most Studied</span>
            </CardTitle>
            <CardDescription>Popular study topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.recommendations.mostStudied.map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <span className="text-xs text-green-700">{topic.totalStudied}x</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span>Underrepresented</span>
            </CardTitle>
            <CardDescription>Topics needing more questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.recommendations.underrepresented.map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <span className="text-xs text-blue-700">{topic.count}q</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};