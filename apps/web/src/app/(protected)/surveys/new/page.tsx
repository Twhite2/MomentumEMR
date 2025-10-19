'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Plus, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

type QuestionType = 'short_text' | 'long_text' | 'multiple_choice' | 'checkboxes' | 'rating' | 'yes_no' | 'date' | 'linear_scale';

interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  required: boolean;
}

export default function NewSurveyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; questions: Question[]; status: string }) => {
      const response = await axios.post('/api/surveys', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Survey created successfully!');
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      router.push('/surveys');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create survey');
    },
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      questionText: '',
      questionType: 'short_text',
      options: [],
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, options: [...q.options, ''] } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
      }
      return q;
    }));
  };

  const handleSubmit = (status: 'draft' | 'active') => {
    if (!title.trim()) {
      toast.error('Please enter a survey title');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const invalidQuestions = questions.filter(q => !q.questionText.trim());
    if (invalidQuestions.length > 0) {
      toast.error('Please fill in all question texts');
      return;
    }

    createMutation.mutate({ title, description, questions, status });
  };

  const questionTypeOptions = [
    { value: 'short_text', label: 'Short Text' },
    { value: 'long_text', label: 'Long Text (Paragraph)' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'checkboxes', label: 'Checkboxes' },
    { value: 'rating', label: 'Rating (1-5 Stars)' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'date', label: 'Date' },
    { value: 'linear_scale', label: 'Linear Scale (1-10)' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/surveys')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-primary">Create New Survey</h1>
      </div>

      {/* Survey Details */}
      <div className="bg-white p-6 rounded-lg border border-border space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Survey Title *</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Post-Visit Patient Satisfaction Survey"
            className="text-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the survey purpose..."
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white p-6 rounded-lg border border-border space-y-4">
            <div className="flex items-start gap-3">
              <GripVertical className="w-5 h-5 text-muted-foreground mt-2 flex-shrink-0" />
              <div className="flex-1 space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => updateQuestion(question.id, { questionText: e.target.value })}
                    placeholder="Enter your question"
                    className="flex-1"
                  />
                  <select
                    value={question.questionType}
                    onChange={(e) => updateQuestion(question.id, { questionType: e.target.value as QuestionType, options: [] })}
                    className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {questionTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Options for multiple choice/checkboxes */}
                {(question.questionType === 'multiple_choice' || question.questionType === 'checkboxes') && (
                  <div className="space-y-2 ml-6">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{optIndex + 1}.</span>
                        <Input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                          placeholder="Option text"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOption(question.id, optIndex)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Required</span>
                  </label>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteQuestion(question.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-0 bg-muted py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={createMutation.isPending}
          className="flex-1"
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit('active')}
          disabled={createMutation.isPending}
          className="flex-1"
        >
          {createMutation.isPending ? 'Publishing...' : 'Publish Survey'}
        </Button>
      </div>
    </div>
  );
}
