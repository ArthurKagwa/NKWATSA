import { FormEvent, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

type MessageSender = 'tutor' | 'learner';

interface TutorMessage {
  id: string;
  sender: MessageSender;
  text: string;
}

interface PracticeQuestion {
  id: string;
  prompt: string;
  answer: boolean;
  explanation: string;
}

interface AITutorProps {
  hasCompleted: boolean;
  onComplete: () => void;
  onLaunchQuiz: () => void;
}

const practicePlan: PracticeQuestion[] = [
  {
    id: 'q1',
    prompt: 'Is 14 a multiple of 2?',
    answer: true,
    explanation: '14 ÷ 2 = 7, so it divides evenly with no remainder.'
  },
  {
    id: 'q2',
    prompt: 'Is 27 a multiple of 2?',
    answer: false,
    explanation: '27 leaves a remainder of 1 when divided by 2 because it is odd.'
  },
  {
    id: 'q3',
    prompt: 'Is 32 a multiple of 2?',
    answer: true,
    explanation: 'Any even number, including 32, is a multiple of 2.'
  }
];

const REQUIRED_CORRECT = practicePlan.length;

const interpretAnswer = (value: string): boolean | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (['yes', 'y', 'true', 't', 'correct', 'even'].includes(normalized)) return true;
  if (['no', 'n', 'false', 'f', 'incorrect', 'odd'].includes(normalized)) return false;
  return null;
};

const followUpResponse = (input: string): string => {
  const text = input.toLowerCase();
  if (text.includes('why') || text.includes('explain')) {
    return 'We call a number a multiple of 2 if it can be written as 2 × n. Even numbers meet this rule, odd numbers do not.';
  }
  if (text.includes('tip') || text.includes('remember')) {
    return 'Scan the ones digit. If it ends in 0, 2, 4, 6, or 8 the number is divisible by 2.';
  }
  if (text.includes('odd')) {
    return 'Odd numbers cannot be divided by 2 without a remainder, so they are never multiples of 2.';
  }
  return 'Keep in mind that dividing by 2 is the same as splitting into two equal groups. If that works cleanly, the number is a multiple of 2.';
};

export function AITutor({ hasCompleted, onComplete, onLaunchQuiz }: AITutorProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [currentIndex, setCurrentIndex] = useState(hasCompleted ? practicePlan.length : 0);
  const [correctAnswers, setCorrectAnswers] = useState(hasCompleted ? REQUIRED_CORRECT : 0);
  const [sessionComplete, setSessionComplete] = useState(hasCompleted);
  const idCounterRef = useRef(0);

  const createMessage = (sender: MessageSender, text: string): TutorMessage => {
    idCounterRef.current += 1;
    return {
      id: `${sender}-${idCounterRef.current}`,
      sender,
      text
    };
  };

  const openingMessages = useMemo(() => {
    if (hasCompleted) {
      return [
        createMessage('tutor', 'You already finished the practice set. Review anything you like and launch the readiness quiz when you are ready.')
      ];
    }

    return [
      createMessage('tutor', 'Hi! I am your AI study guide. Let us warm up on multiples of 2 before you take the readiness quiz.'),
      createMessage('tutor', 'Remember: a number is a multiple of 2 when it divides evenly by 2. That means no remainder.'),
      createMessage('tutor', `${practicePlan[0].prompt} (answer with yes or no)`)
    ];
  }, [hasCompleted]);

  const [messages, setMessages] = useState<TutorMessage[]>(openingMessages);

  const pushTutorMessage = (text: string) => {
    setMessages((prev) => [...prev, createMessage('tutor', text)]);
  };

  const askNextQuestion = (nextIndex: number) => {
    if (nextIndex >= practicePlan.length) return;
    pushTutorMessage(`${practicePlan[nextIndex].prompt} (yes/no)`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim()) return;
    const learnerResponse = inputValue.trim();
    setMessages((prev) => [...prev, createMessage('learner', learnerResponse)]);
    setInputValue('');

    if (sessionComplete || currentIndex >= practicePlan.length) {
      pushTutorMessage(followUpResponse(learnerResponse));
      return;
    }

    const interpreted = interpretAnswer(learnerResponse);
    if (interpreted === null) {
      pushTutorMessage('Try responding with yes or no so I can coach you precisely.');
      return;
    }

    const question = practicePlan[currentIndex];
    const isCorrect = interpreted === question.answer;

    if (isCorrect) {
      const updatedCorrect = correctAnswers + 1;
      setCorrectAnswers(updatedCorrect);
      pushTutorMessage(`Correct! ${question.explanation}`);

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (updatedCorrect >= REQUIRED_CORRECT) {
        setSessionComplete(true);
        onComplete();
        pushTutorMessage('Nice work! You are warmed up and ready for the readiness quiz.');
      } else {
        askNextQuestion(nextIndex);
      }
    } else {
      pushTutorMessage(`Not quite. ${question.explanation} Think about whether the number is even or odd and try again.`);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Tutor Warm-Up</span>
          <Progress value={(correctAnswers / REQUIRED_CORRECT) * 100} className="w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-72 overflow-y-auto rounded-md border border-border/60 bg-muted/50 p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.sender === 'tutor' ? 'text-sm text-primary-foreground bg-primary/10 border border-primary/20 rounded-md px-3 py-2' : 'text-sm text-muted-foreground bg-background border border-border rounded-md px-3 py-2 ml-auto max-w-[80%]'}
            >
              {message.text}
            </div>
          ))}
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={sessionComplete ? 'Ask a follow-up question or review a concept...' : 'Type yes or no, or ask for help...'}
            disabled={!user}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!user}>
              {sessionComplete ? 'Ask Tutor' : 'Send Response'}
            </Button>
            <Button type="button" variant="outline" disabled={!user} onClick={() => setInputValue('Could you explain how to spot even numbers?')}>
              Need a Hint
            </Button>
          </div>
        </form>

        <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground space-y-2">
          <div>Goal: get comfortable with multiples of 2 before starting the readiness quiz.</div>
          <div>Progress: {correctAnswers} of {REQUIRED_CORRECT} practice checks correct.</div>
        </div>

        <Button
          className="w-full"
          variant={sessionComplete ? 'default' : 'secondary'}
          disabled={!sessionComplete}
          onClick={onLaunchQuiz}
        >
          {sessionComplete ? 'Launch Readiness Quiz' : 'Complete practice to unlock the quiz'}
        </Button>
      </CardContent>
    </Card>
  );
}
