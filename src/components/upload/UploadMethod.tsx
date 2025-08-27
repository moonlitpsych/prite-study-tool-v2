import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Camera, 
  FileText, 
  Upload, 
  Smartphone,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export type UploadMethodType = 'camera' | 'text' | 'file' | 'batch';

interface UploadMethodProps {
  selectedMethod: UploadMethodType;
  onMethodChange: (method: UploadMethodType) => void;
}

export const UploadMethod = ({ selectedMethod, onMethodChange }: UploadMethodProps) => {
  const methods = [
    {
      id: 'camera' as const,
      title: 'Camera/Photo',
      description: 'Take a photo or upload an image of PRITE questions',
      icon: Camera,
      features: ['Direct photo capture', 'Image upload', 'Auto-cropping', 'Multi-page support'],
      difficulty: 'Easy',
      accuracy: 'High',
      color: 'blue',
    },
    {
      id: 'text' as const,
      title: 'Text Paste',
      description: 'Paste text from iOS Live Text or other OCR',
      icon: FileText,
      features: ['iOS Live Text', 'Copy/paste workflow', 'Quick processing', 'Edit before submit'],
      difficulty: 'Easy',
      accuracy: 'Very High',
      color: 'green',
    },
    {
      id: 'file' as const,
      title: 'File Upload',
      description: 'Upload PDF or image files',
      icon: Upload,
      features: ['PDF support', 'Multiple formats', 'Batch processing', 'File management'],
      difficulty: 'Medium',
      accuracy: 'High',
      color: 'purple',
    },
    {
      id: 'batch' as const,
      title: 'Batch Processing',
      description: 'Process multiple exams at once',
      icon: Zap,
      features: ['Multiple files', 'Auto-categorization', 'Bulk explanations', 'Time saving'],
      difficulty: 'Advanced',
      accuracy: 'High',
      color: 'orange',
    },
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'ring-blue-500 bg-blue-50' : 'hover:bg-blue-50',
      green: isSelected ? 'ring-green-500 bg-green-50' : 'hover:bg-green-50',
      purple: isSelected ? 'ring-purple-500 bg-purple-50' : 'hover:bg-purple-50',
      orange: isSelected ? 'ring-orange-500 bg-orange-50' : 'hover:bg-orange-50',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAccuracyIcon = (accuracy: string) => {
    return accuracy === 'Very High' ? CheckCircle : AlertCircle;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload PRITE Questions</h2>
        <p className="text-muted-foreground">
          Choose your preferred method to digitize your PRITE exam questions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          const AccuracyIcon = getAccuracyIcon(method.accuracy);
          const isSelected = selectedMethod === method.id;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2' : 'hover:shadow-md'
              } ${getColorClasses(method.color, isSelected)}`}
              onClick={() => onMethodChange(method.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    method.color === 'blue' ? 'bg-blue-100' :
                    method.color === 'green' ? 'bg-green-100' :
                    method.color === 'purple' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      method.color === 'blue' ? 'text-blue-600' :
                      method.color === 'green' ? 'text-green-600' :
                      method.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <span>{method.title}</span>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(method.difficulty)}`}>
                      {method.difficulty}
                    </span>
                    <div className="flex items-center space-x-1">
                      <AccuracyIcon className={`h-4 w-4 ${
                        method.accuracy === 'Very High' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                      <span className="text-xs text-muted-foreground">{method.accuracy}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features:</h4>
                  <ul className="space-y-1">
                    {method.features.map((feature, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedMethod && (
        <div className="bg-accent/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">
              {methods.find(m => m.id === selectedMethod)?.title} Selected
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedMethod === 'camera' && "Perfect for capturing questions directly from your phone. Make sure the image is clear and well-lit."}
            {selectedMethod === 'text' && "Great for iOS users! Use Live Text to copy questions, then paste them here for processing."}
            {selectedMethod === 'file' && "Upload PDF files or images of your PRITE exams. Supports multiple pages and formats."}
            {selectedMethod === 'batch' && "Process multiple exams efficiently. Great for adding entire years of PRITE questions at once."}
          </p>
        </div>
      )}
    </div>
  );
};