'use client';

import { Button } from '@momentum/ui';
import { ArrowLeft, Download, Share2, BarChart3, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SurveyResultsPage() {
  const params = useParams();
  const surveyId = params.id as string;

  // Mock data based on survey ID
  const surveyData = {
    '1': {
      title: 'Post-Visit Patient Satisfaction',
      description: 'Feedback on doctor consultation and overall experience',
      totalResponses: 247,
      averageRating: 4.5,
      questions: [
        {
          question: 'How satisfied were you with your doctor consultation?',
          responses: { 'Very Satisfied': 180, 'Satisfied': 50, 'Neutral': 10, 'Dissatisfied': 5, 'Very Dissatisfied': 2 }
        },
        {
          question: 'How would you rate the waiting time?',
          responses: { 'Excellent': 120, 'Good': 80, 'Fair': 30, 'Poor': 15, 'Very Poor': 2 }
        },
        {
          question: 'How clean and comfortable was the facility?',
          responses: { 'Very Clean': 200, 'Clean': 35, 'Acceptable': 10, 'Needs Improvement': 2 }
        }
      ]
    },
    '2': {
      title: 'Pharmacy Service Quality',
      description: 'Rate medication dispensing and pharmacist support',
      totalResponses: 156,
      averageRating: 4.3,
      questions: [
        {
          question: 'How helpful was the pharmacist in explaining your medication?',
          responses: { 'Very Helpful': 110, 'Helpful': 35, 'Neutral': 8, 'Not Helpful': 3 }
        },
        {
          question: 'How satisfied were you with the medication dispensing time?',
          responses: { 'Very Satisfied': 90, 'Satisfied': 50, 'Neutral': 12, 'Dissatisfied': 4 }
        }
      ]
    },
    '3': {
      title: 'Facility Cleanliness Survey',
      description: 'Hospital hygiene and cleanliness feedback',
      totalResponses: 412,
      averageRating: 4.7,
      questions: [
        {
          question: 'How clean was the waiting area?',
          responses: { 'Very Clean': 350, 'Clean': 50, 'Acceptable': 10, 'Needs Improvement': 2 }
        },
        {
          question: 'How clean were the restrooms?',
          responses: { 'Very Clean': 300, 'Clean': 90, 'Acceptable': 15, 'Needs Improvement': 7 }
        }
      ]
    }
  };

  const survey = surveyData[surveyId as keyof typeof surveyData] || surveyData['1'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/surveys">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Surveys
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary">{survey.title}</h1>
            <p className="text-muted-foreground mt-1">{survey.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
              <p className="text-3xl font-bold text-primary mt-1">{survey.totalResponses}</p>
            </div>
            <Users className="w-12 h-12 text-primary/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{survey.averageRating}/5</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="text-3xl font-bold text-primary mt-1">{survey.questions.length}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Question Results */}
      <div className="space-y-6">
        {survey.questions.map((q, idx) => {
          const total = Object.values(q.responses).reduce((sum, val) => sum + val, 0);
          
          return (
            <div key={idx} className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Question {idx + 1}: {q.question}
              </h3>
              <div className="space-y-3">
                {Object.entries(q.responses).map(([option, count]) => {
                  const percentage = ((count / total) * 100).toFixed(1);
                  
                  return (
                    <div key={option} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{option}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Total Responses: <span className="font-semibold text-primary">{total}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button variant="outline">View Individual Responses</Button>
        <Button variant="outline">Download Full Report</Button>
      </div>
    </div>
  );
}
