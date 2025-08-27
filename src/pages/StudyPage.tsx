import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Play, Settings } from 'lucide-react';

export const StudyPage = () => {
  const [studyMode, setStudyMode] = useState<'spaced' | 'practice' | 'custom'>('spaced');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Session</h1>
          <p className="text-muted-foreground">Choose your study mode and start learning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`cursor-pointer transition-all ${studyMode === 'spaced' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStudyMode('spaced')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Spaced Repetition</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Study questions that are due for review based on your past performance
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all ${studyMode === 'practice' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStudyMode('practice')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Practice Mode</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Practice with random questions from the community database
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all ${studyMode === 'custom' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStudyMode('custom')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Custom Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create a custom study session with specific categories and difficulty
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Session Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <select className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="10">10 questions</option>
                <option value="20" selected>20 questions</option>
                <option value="30">30 questions</option>
                <option value="50">50 questions</option>
              </select>
            </div>

            <Button size="lg" className="w-full md:w-auto">
              <Play className="h-4 w-4 mr-2" />
              Start Study Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};