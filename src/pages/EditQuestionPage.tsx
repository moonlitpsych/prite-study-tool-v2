import { useParams } from 'react-router-dom';
import { QuestionForm } from '@/components/QuestionForm';

export const EditQuestionPage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Question ID not found</div>;
  }

  return <QuestionForm questionId={id} />;
};