import { v4 as uuidv4 } from 'uuid';
import { sha256Hex } from './hash';

export interface QuizItem {
  id: string;
  stem: string;
  options?: string[];
  answer_format: 'boolean' | 'multiple_choice';
  correct_answer: boolean | string;
}

export interface Quiz {
  quiz_id: string;
  items: QuizItem[];
  expires_at: string;
}

export function generateReadinessQuiz(): Quiz {
  const items: QuizItem[] = [];
  const numbers = Array.from({ length: 30 }, (_, i) => i + 1);
  
  // Shuffle numbers and take 10
  const shuffled = numbers.sort(() => Math.random() - 0.5).slice(0, 10);
  
  shuffled.forEach(num => {
    items.push({
      id: uuidv4(),
      stem: `Is ${num} a multiple of 2?`,
      answer_format: 'boolean',
      correct_answer: num % 2 === 0
    });
  });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  
  return {
    quiz_id: uuidv4(),
    items,
    expires_at: expiresAt.toISOString()
  };
}

export function scoreQuizAttempt(
  items: QuizItem[],
  answers: { id: string; value: boolean }[],
  startedAt: string,
  submittedAt: string
): {
  score_raw: number;
  score_max: number;
  duration_s: number;
  passed: boolean;
} {
  const startTime = new Date(startedAt).getTime();
  const endTime = new Date(submittedAt).getTime();
  const durationS = Math.floor((endTime - startTime) / 1000);
  
  let scoreRaw = 0;
  const scoreMax = items.length;
  
  // Create answer map for quick lookup
  const answerMap = new Map(answers.map(a => [a.id, a.value]));
  
  items.forEach(item => {
    const userAnswer = answerMap.get(item.id);
    if (userAnswer === item.correct_answer) {
      scoreRaw++;
    }
  });
  
  // Passing rule: 8/10 correct within 180 seconds
  const passed = scoreRaw >= 8 && durationS <= 180;
  
  return {
    score_raw: scoreRaw,
    score_max: scoreMax,
    duration_s: durationS,
    passed
  };
}

export async function generateAttestationProof(
  learnerAddr: string,
  courseId: string,
  moduleId: string,
  scorePct: number,
  passedAt: string
): Promise<string> {
  const attestationData = {
    learner: learnerAddr,
    course: courseId,
    module: moduleId,
    score_percentage: scorePct,
    passed_at: passedAt,
    schema: 'NKWATSAICheckpoint_v1'
  };
  
  const jsonString = JSON.stringify(attestationData, Object.keys(attestationData).sort());
  return sha256Hex(jsonString);
}
