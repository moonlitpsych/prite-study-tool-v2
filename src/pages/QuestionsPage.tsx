import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { trpc } from '@/lib/trpc';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  ChevronUp, 
  ChevronDown,
  BookOpen,
  User,
  Calendar,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  ThumbsUp,
  ThumbsDown,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

type SortBy = 'newest' | 'oldest' | 'most-studied' | 'highest-rated';
type FilterCategory = 'all' | 'Adult Psychiatry' | 'Child Psychiatry' | 'Addiction Psychiatry' | 'Geriatric Psychiatry' | 'Forensic Psychiatry' | 'Consultation-Liaison Psychiatry' | 'Emergency Psychiatry' | 'Neurology';
type FilterDifficulty = 'all' | 'easy' | 'medium' | 'hard';
type FilterExamPart = 'all' | 'Part 1' | 'Part 2';
type ViewMode = 'community' | 'my-questions';

interface QuestionWithStats {
  id: string;
  text: string;
  options: { label: string; text: string }[];
  correctAnswers: string[];
  explanation?: string;
  category: string;
  examPart: string;
  difficulty: string;
  topics: string[];
  isPublic: boolean;
  isVerified: boolean;
  timesStudied: number;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    name: string;
    contributionScore: number;
    reputation: number;
  };
  stats: {
    upvotes: number;
    downvotes: number;
    score: number;
    averageRating: number | null;
    timesStudied: number;
    reviewCount: number;
  };
}

export const QuestionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');
  const [filterExamPart, setFilterExamPart] = useState<FilterExamPart>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('community');
  const [page, setPage] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const limit = 20;
  const offset = page * limit;

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    category: filterCategory !== 'all' ? filterCategory : undefined,
    difficulty: filterDifficulty !== 'all' ? filterDifficulty : undefined,
    examPart: filterExamPart !== 'all' ? filterExamPart : undefined,
    isPublic: viewMode === 'community' ? true : undefined,
    limit,
    offset,
  };

  // TRPC queries
  const { 
    data: questionsData, 
    isLoading, 
    error,
    refetch 
  } = viewMode === 'my-questions' 
    ? trpc.questions.getMy.useQuery({ limit, offset })
    : trpc.questions.getAll.useQuery(queryParams);

  // TRPC mutations
  const voteMutation = trpc.questions.vote.useMutation({
    onSuccess: () => refetch(),
  });
  const removeVoteMutation = trpc.questions.removeVote.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteMutation = trpc.questions.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedQuestion(null);
    },
  });

  const questions = (questionsData as any)?.questions || [];
  const hasMore = (questionsData as any)?.hasMore || false;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterCategory, filterDifficulty, filterExamPart, viewMode]);

  const handleVote = async (questionId: string, voteType: 'up' | 'down') => {
    if (!user) return;
    try {
      await voteMutation.mutateAsync({ questionId, voteType });
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!user || !confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteMutation.mutateAsync(questionId);
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccuracyFromStats = (question: QuestionWithStats) => {
    // This would ideally come from aggregated study records
    // For now, we'll estimate based on difficulty and votes
    const baseAccuracy = question.difficulty === 'easy' ? 85 : question.difficulty === 'medium' ? 70 : 55;
    const voteAdjustment = question.stats.score > 0 ? 5 : question.stats.score < 0 ? -5 : 0;
    return Math.max(30, Math.min(95, baseAccuracy + voteAdjustment));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const categories: FilterCategory[] = [
    'all', 'Adult Psychiatry', 'Child Psychiatry', 'Addiction Psychiatry', 
    'Geriatric Psychiatry', 'Forensic Psychiatry', 'Consultation-Liaison Psychiatry', 
    'Emergency Psychiatry', 'Neurology'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">
            {viewMode === 'community' ? 'Browse community questions' : 'Manage your questions'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('community')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'community' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Community
            </button>
            <button
              onClick={() => setViewMode('my-questions')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'my-questions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Questions
            </button>
          </div>
          <Link to="/questions/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions, categories, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(filterCategory !== 'all' || filterDifficulty !== 'all' || filterExamPart !== 'all') && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {[filterCategory, filterDifficulty, filterExamPart].filter(f => f !== 'all').length}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value as FilterDifficulty)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Exam Part</label>
                  <select
                    value={filterExamPart}
                    onChange={(e) => setFilterExamPart(e.target.value as FilterExamPart)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Parts</option>
                    <option value="Part 1">Part 1</option>
                    <option value="Part 2">Part 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most-studied">Most Studied</option>
                    <option value="highest-rated">Highest Rated</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterDifficulty('all');
                    setFilterExamPart('all');
                    setSearchQuery('');
                  }}
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-2">Failed to load questions</div>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No questions found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterCategory !== 'all' || filterDifficulty !== 'all' || filterExamPart !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : viewMode === 'my-questions'
                ? "You haven't created any questions yet"
                : 'No questions available in the community bank'
              }
            </p>
            <Link to="/questions/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question: QuestionWithStats) => (
            <Card key={question.id} className="hover:bg-accent/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Vote buttons */}
                  {user && viewMode === 'community' && (
                    <div className="flex flex-col items-center space-y-1">
                      <button
                        onClick={() => handleVote(question.id, 'up')}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                        disabled={voteMutation.isLoading}
                      >
                        <ChevronUp className="h-4 w-4 text-green-600" />
                      </button>
                      <span className={`text-sm font-medium ${
                        question.stats.score > 0 ? 'text-green-600' : 
                        question.stats.score < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {question.stats.score}
                      </span>
                      <button
                        onClick={() => handleVote(question.id, 'down')}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        disabled={voteMutation.isLoading}
                      >
                        <ChevronDown className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  )}

                  {/* Question icon */}
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium mb-2 cursor-pointer hover:text-primary transition-colors" 
                             onClick={() => navigate(`/questions/${question.id}`)}>
                          {question.text.length > 120 
                            ? question.text.substring(0, 120) + '...' 
                            : question.text
                          }
                        </div>
                      </div>
                      
                      {/* Actions menu */}
                      {user && (question.createdBy.id === user.id || viewMode === 'my-questions') && (
                        <div className="relative">
                          <button
                            onClick={() => setSelectedQuestion(selectedQuestion === question.id ? null : question.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {selectedQuestion === question.id && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                              <button
                                onClick={() => {
                                  navigate(`/questions/${question.id}/edit`);
                                  setSelectedQuestion(null);
                                }}
                                className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left"
                              >
                                <Edit className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <span className="font-medium">{question.category}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span>{question.examPart}</span>
                      <span>•</span>
                      <span>{getAccuracyFromStats(question)}% accuracy</span>
                      {question.isVerified && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-medium">✓ Verified</span>
                        </>
                      )}
                    </div>

                    {/* Topics */}
                    {question.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {question.topics.slice(0, 3).map((topic) => (
                          <span key={topic} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {topic}
                          </span>
                        ))}
                        {question.topics.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{question.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>@{question.createdBy.username}</span>
                          {question.createdBy.reputation > 0 && (
                            <span className="flex items-center text-yellow-600">
                              <Star className="h-3 w-3 mr-0.5" />
                              {question.createdBy.reputation}
                            </span>
                          )}
                        </div>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatTimeAgo(question.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Studied {question.stats.timesStudied} times</span>
                        {question.stats.averageRating && (
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-0.5 text-yellow-500" />
                            {question.stats.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {questions.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, offset + questions.length)} 
            {(questionsData as any)?.total ? ` of ${(questionsData as any).total}` : ''}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(Math.max(0, page - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {selectedQuestion && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
};