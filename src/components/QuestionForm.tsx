import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { trpc } from '@/lib/trpc';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';

interface Option {
  label: string;
  text: string;
}

interface QuestionFormData {
  text: string;
  options: Option[];
  correctAnswers: string[];
  explanation?: string;
  category: string;
  subcategory?: string;
  examPart: 'Part 1' | 'Part 2';
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  isPublic: boolean;
}

interface QuestionFormProps {
  questionId?: string;
  initialData?: Partial<QuestionFormData>;
  onSave?: (question: any) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  'Adult Psychiatry',
  'Child Psychiatry', 
  'Addiction Psychiatry',
  'Geriatric Psychiatry',
  'Forensic Psychiatry',
  'Consultation-Liaison Psychiatry',
  'Emergency Psychiatry',
  'Neurology'
];

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const QuestionForm = ({ questionId, initialData, onSave, onCancel }: QuestionFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<QuestionFormData>({
    text: '',
    options: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ],
    correctAnswers: [],
    explanation: '',
    category: 'Adult Psychiatry',
    subcategory: '',
    examPart: 'Part 1',
    difficulty: 'medium',
    topics: [],
    isPublic: true,
    ...initialData,
  });
  
  const [newTopic, setNewTopic] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing question if editing
  const { data: existingQuestion, isLoading } = trpc.questions.getById.useQuery(
    questionId!, 
    { enabled: !!questionId }
  );

  // Mutations
  const createMutation = trpc.questions.create.useMutation();
  const updateMutation = trpc.questions.update.useMutation();

  useEffect(() => {
    if (existingQuestion && questionId) {
      setFormData({
        text: existingQuestion.text,
        options: (existingQuestion.options as any[]).map((opt: any) => ({ label: opt.label, text: opt.text })),
        correctAnswers: existingQuestion.correctAnswers,
        explanation: existingQuestion.explanation || '',
        category: existingQuestion.category,
        subcategory: existingQuestion.subcategory || '',
        examPart: existingQuestion.examPart as 'Part 1' | 'Part 2',
        difficulty: existingQuestion.difficulty as 'easy' | 'medium' | 'hard',
        topics: existingQuestion.topics,
        isPublic: existingQuestion.isPublic,
      });
    }
  }, [existingQuestion, questionId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.text.trim().length < 10) {
      newErrors.text = 'Question text must be at least 10 characters long';
    }

    const filledOptions = formData.options.filter(opt => opt.text.trim());
    if (filledOptions.length < 2) {
      newErrors.options = 'At least 2 answer options are required';
    }

    if (formData.correctAnswers.length === 0) {
      newErrors.correctAnswers = 'At least one correct answer must be selected';
    }

    // Check that all selected correct answers have corresponding options
    const validCorrectAnswers = formData.correctAnswers.every(answer =>
      formData.options.some(opt => opt.label === answer && opt.text.trim())
    );
    if (!validCorrectAnswers) {
      newErrors.correctAnswers = 'All correct answers must have corresponding option text';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Filter out empty options
    const cleanedOptions = formData.options.filter(opt => opt.text.trim());
    
    const dataToSubmit = {
      ...formData,
      options: cleanedOptions,
      topics: formData.topics.filter(topic => topic.trim()),
    };

    try {
      if (questionId) {
        // Update existing question
        const updated = await updateMutation.mutateAsync({
          id: questionId,
          ...dataToSubmit,
        });
        onSave?.(updated);
        navigate('/questions');
      } else {
        // Create new question
        const created = await createMutation.mutateAsync(dataToSubmit);
        onSave?.(created);
        navigate('/questions');
      }
    } catch (error: any) {
      console.error('Failed to save question:', error);
      setErrors({ submit: error.message || 'Failed to save question' });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/questions');
    }
  };

  const addOption = () => {
    if (formData.options.length < 8) {
      const nextLabel = OPTION_LABELS[formData.options.length];
      setFormData({
        ...formData,
        options: [...formData.options, { label: nextLabel, text: '' }],
      });
    }
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    const removedLabel = formData.options[index].label;
    const newCorrectAnswers = formData.correctAnswers.filter(answer => answer !== removedLabel);
    
    setFormData({
      ...formData,
      options: newOptions,
      correctAnswers: newCorrectAnswers,
    });
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index].text = text;
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const toggleCorrectAnswer = (label: string) => {
    const isCurrentlyCorrect = formData.correctAnswers.includes(label);
    const newCorrectAnswers = isCurrentlyCorrect
      ? formData.correctAnswers.filter(answer => answer !== label)
      : [...formData.correctAnswers, label];

    setFormData({
      ...formData,
      correctAnswers: newCorrectAnswers,
    });
  };

  const addTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      setFormData({
        ...formData,
        topics: [...formData.topics, newTopic.trim()],
      });
      setNewTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(topic => topic !== topicToRemove),
    });
  };

  if (isLoading && questionId) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {questionId ? 'Edit Question' : 'Create New Question'}
          </h1>
          <p className="text-muted-foreground">
            {questionId ? 'Update your question details' : 'Add a new question to the community bank'}
          </p>
        </div>
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Text */}
        <Card>
          <CardHeader>
            <CardTitle>Question Text</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter your PRITE question here..."
              className="w-full h-32 p-3 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            {errors.text && (
              <p className="text-red-500 text-sm mt-1">{errors.text}</p>
            )}
            <div className="text-sm text-muted-foreground mt-2">
              {formData.text.length}/2000 characters
            </div>
          </CardContent>
        </Card>

        {/* Answer Options */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Answer Options</CardTitle>
              {formData.options.length < 8 && (
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.correctAnswers.includes(option.label)}
                      onChange={() => toggleCorrectAnswer(option.label)}
                      className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="font-semibold text-lg min-w-[2rem]">
                      {option.label}.
                    </span>
                  </div>
                  <textarea
                    value={option.text}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Enter option ${option.label} text...`}
                    className="flex-1 p-2 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={2}
                    required={index < 2} // First two options are required
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-red-500 text-sm mt-2">{errors.options}</p>
            )}
            {errors.correctAnswers && (
              <p className="text-red-500 text-sm mt-2">{errors.correctAnswers}</p>
            )}
            <div className="text-sm text-muted-foreground mt-3">
              ✓ Check the box next to correct answer(s). Multiple correct answers are allowed.
            </div>
          </CardContent>
        </Card>

        {/* Question Details */}
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Exam Part</label>
                <select
                  value={formData.examPart}
                  onChange={(e) => setFormData({ ...formData, examPart: e.target.value as 'Part 1' | 'Part 2' })}
                  className="w-full p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="Part 1">Part 1</option>
                  <option value="Part 2">Part 2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className="w-full p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium mb-2">Subcategory (Optional)</label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., Mood Disorders, Anxiety Disorders"
                  className="w-full p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Make this question public</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Public questions can be studied by the entire community and help everyone learn together.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Topics & Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Add a topic or keyword..."
                  className="flex-1 p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                />
                <Button type="button" onClick={addTopic} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.topics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => removeTopic(topic)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>Explanation (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Provide a detailed explanation of the correct answer and why other options are incorrect..."
              className="w-full h-32 p-3 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="text-sm text-muted-foreground mt-2">
              {formData.explanation?.length || 0}/2000 characters • 
              AI explanations can be generated later if you prefer
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          
          {errors.submit && (
            <p className="text-red-500 text-sm">{errors.submit}</p>
          )}
          
          <Button
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading}
            size="lg"
          >
            {createMutation.isLoading || updateMutation.isLoading ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {questionId ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </form>
    </div>
  );
};