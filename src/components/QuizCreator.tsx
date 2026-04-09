import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Check, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GoogleGenAI, Type } from "@google/genai";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizCreatorProps {
  onSave: (quiz: { title: string; description: string; timeLimit: number; questions: Question[] }) => void;
  onCancel: () => void;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('10');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a quiz with 5 multiple choice questions about: ${aiPrompt}. 
        Return the response as a JSON array of objects, each with 'question' (string), 'options' (array of 4 strings), and 'correctAnswer' (number, 0-3).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4
                },
                correctAnswer: { type: Type.INTEGER }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        }
      });

      const generatedQuestions = JSON.parse(response.text);
      if (Array.isArray(generatedQuestions)) {
        setQuestions(generatedQuestions);
        if (!title) setTitle(`Quiz: ${aiPrompt}`);
        if (!description) setDescription(`AI generated quiz about ${aiPrompt}`);
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate quiz questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title) return alert('Please enter a quiz title');
    if (questions.some(q => !q.question || q.options.some(o => !o))) {
      return alert('Please fill in all questions and options');
    }
    onSave({ 
      title, 
      description, 
      timeLimit: parseInt(timeLimit) || 0, 
      questions 
    });
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      {/* AI Generation Tool */}
      <Card className="bg-blue-50 border-blue-100 rounded-2xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5 fill-current" />
            <h3 className="font-black uppercase tracking-widest text-xs">AI Quiz Generator</h3>
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter a topic (e.g. Hardware, Internet, Grade 6 Lesson 1)..." 
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="bg-white border-blue-200"
            />
            <Button 
              onClick={handleAiGenerate} 
              disabled={isGenerating || !aiPrompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 shrink-0"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </Button>
          </div>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            Gemini will create 5 questions based on your topic.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Quiz Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grade 6 ICT Mid-term Quiz" />
        </div>
        <div className="grid gap-2">
          <Label>Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what this quiz covers" />
        </div>
        <div className="grid gap-2">
          <Label>Time Limit (minutes)</Label>
          <Input 
            type="number" 
            value={timeLimit} 
            onChange={e => setTimeLimit(e.target.value)} 
            placeholder="e.g. 10" 
            min="1"
          />
          <p className="text-xs text-slate-400 font-medium">Set to 0 for no time limit.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Questions</h3>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-2">
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>

        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="relative">
            <CardContent className="pt-6 space-y-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-slate-400 hover:text-red-600"
                onClick={() => removeQuestion(qIndex)}
                disabled={questions.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="grid gap-2">
                <Label>Question {qIndex + 1}</Label>
                <Input 
                  value={q.question} 
                  onChange={e => updateQuestion(qIndex, 'question', e.target.value)} 
                  placeholder="Enter your question here"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={q.correctAnswer === oIndex ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                    >
                      {q.correctAnswer === oIndex ? <Check className="h-4 w-4" /> : oIndex + 1}
                    </Button>
                    <Input 
                      value={option} 
                      onChange={e => updateOption(qIndex, oIndex, e.target.value)} 
                      placeholder={`Option ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Quiz</Button>
      </div>
    </div>
  );
};

export default QuizCreator;
