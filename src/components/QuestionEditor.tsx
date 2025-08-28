import { useState } from 'react';
import { Check, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface QuestionOption {
  label: string;
  text: string;
}

interface ProcessedQuestion {
  number: number;
  text: string;
  options: QuestionOption[];
  category?: string;
  topics?: string[];
  correctAnswer?: string;
  confidence?: number;
  saved?: boolean;
}

interface QuestionEditorProps {
  question: ProcessedQuestion;
  examYear?: number;
  examPart?: number;
  onSave: (updatedQuestion: ProcessedQuestion & { examYear: number; examPart: number }) => void;
  onCancel?: () => void;
}

export const QuestionEditor = ({ question, examYear = new Date().getFullYear(), examPart = 1, onSave, onCancel }: QuestionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [selectedAnswer, setSelectedAnswer] = useState(question.correctAnswer || '');
  const [currentExamYear, setCurrentExamYear] = useState(examYear);
  const [currentExamPart, setCurrentExamPart] = useState(examPart);
  const [newTopic, setNewTopic] = useState('');

  const handleSave = () => {
    const finalQuestion = {
      ...editedQuestion,
      correctAnswer: selectedAnswer,
      examYear: currentExamYear,
      examPart: currentExamPart
    };
    onSave(finalQuestion);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuestion(question);
    setSelectedAnswer(question.correctAnswer || '');
    setIsEditing(false);
    onCancel?.();
  };

  const handleOptionChange = (index: number, newText: string) => {
    const updatedOptions = [...editedQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], text: newText };
    setEditedQuestion({ ...editedQuestion, options: updatedOptions });
  };

  const addTopic = () => {
    if (newTopic.trim() && !editedQuestion.topics?.includes(newTopic.trim())) {
      setEditedQuestion({
        ...editedQuestion,
        topics: [...(editedQuestion.topics || []), newTopic.trim()]
      });
      setNewTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setEditedQuestion({
      ...editedQuestion,
      topics: editedQuestion.topics?.filter(topic => topic !== topicToRemove)
    });
  };

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
      {/* Header with Question Number and Metadata */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="font-medium text-lg text-blue-600 bg-blue-50 px-3 py-1 rounded">
            Question {question.number}
          </div>
          <div className="text-sm text-gray-500">
            {question.confidence}% confidence • {question.category}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center space-x-1"
                disabled={!selectedAnswer || question.saved}
              >
                <Save className="h-4 w-4" />
                <span>{question.saved ? 'Saved' : 'Save Question'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* PRITE Exam Metadata */}
      {isEditing && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">PRITE Exam Year</label>
            <Input
              type="number"
              value={currentExamYear}
              onChange={(e) => setCurrentExamYear(parseInt(e.target.value))}
              min="2015"
              max="2030"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PRITE Part</label>
            <select
              value={currentExamPart}
              onChange={(e) => setCurrentExamPart(parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={1}>Part 1</option>
              <option value={2}>Part 2</option>
            </select>
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="space-y-3">
        <label className="font-medium text-gray-900">Question Text:</label>
        {isEditing ? (
          <textarea
            value={editedQuestion.text}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
            className="w-full min-h-[100px] p-3 border rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="bg-gray-50 p-3 rounded-md text-sm leading-relaxed">
            {editedQuestion.text}
          </div>
        )}
      </div>

      {/* Answer Choices */}
      <div className="space-y-3">
        <label className="font-medium text-gray-900">Answer Choices:</label>
        <div className="space-y-3">
          {editedQuestion.options.map((option, index) => (
            <div key={option.label} className="flex items-start space-x-3 p-3 border rounded-md">
              {/* Correct Answer Radio Button */}
              <input
                type="radio"
                id={`correct-${option.label}`}
                name="correctAnswer"
                value={option.label}
                checked={selectedAnswer === option.label}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
              />
              
              {/* Option Label */}
              <div className="font-medium text-sm w-8">{option.label}.</div>
              
              {/* Option Text */}
              <div className="flex-1">
                {isEditing ? (
                  <textarea
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full min-h-[40px] p-2 border rounded text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm leading-relaxed">
                    {option.text}
                  </div>
                )}
              </div>
              
              {/* Correct Answer Indicator */}
              {selectedAnswer === option.label && (
                <Check className="h-5 w-5 text-green-600 mt-1" />
              )}
            </div>
          ))}
        </div>
        
        {!selectedAnswer && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
            ⚠️ Please select the correct answer before saving
          </div>
        )}
      </div>

      {/* Topics */}
      <div className="space-y-3">
        <label className="font-medium text-gray-900">Topics:</label>
        <div className="flex flex-wrap gap-2">
          {editedQuestion.topics?.map((topic, index) => (
            <span
              key={index}
              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center space-x-1"
            >
              <span>{topic}</span>
              {isEditing && (
                <button
                  onClick={() => removeTopic(topic)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
        
        {isEditing && (
          <div className="flex space-x-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Add new topic..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addTopic()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addTopic}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
        )}
      </div>

      {/* Save Status */}
      {question.saved ? (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md flex items-center space-x-1">
          <Check className="h-4 w-4" />
          <span>Question saved successfully!</span>
        </div>
      ) : selectedAnswer ? (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md flex items-center space-x-1">
          <Check className="h-4 w-4" />
          <span>Correct answer: {selectedAnswer} • Ready to save</span>
        </div>
      ) : (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
          ⚠️ Please select the correct answer before saving
        </div>
      )}
    </div>
  );
};