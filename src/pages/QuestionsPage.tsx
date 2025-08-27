import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Plus, Search, Filter } from 'lucide-react';

export const QuestionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">Browse and manage community questions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Sample question cards */}
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-2">
                    Sample question {i}: Which of the following medications is most commonly...
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Adult Psychiatry</span>
                    <span>•</span>
                    <span>Medium</span>
                    <span>•</span>
                    <span>Part 1</span>
                    <span>•</span>
                    <span>92% accuracy</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                      By @resident123 • 2 days ago
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ↑ 15
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Studied 45 times
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};