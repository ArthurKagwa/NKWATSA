import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { QuizItem } from './quiz';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
}

export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

type Maybe<T> = T | null;

type IdempotentResponse = { response_data: string };

type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

interface QuizRecord {
  quiz_id: string;
  course_id: string;
  module_id: string;
  expires_at: string;
}

interface ProgressRecord {
  wallet: string;
  course_id: string;
  module_id: string;
  latest_attempt_id: string | null;
  status: string;
  passed_at: string | null;
  version: number;
}

interface AttemptRecord {
  attempt_id: string;
  wallet: string;
  course_id: string;
  module_id: string;
  quiz_id: string | null;
  score_raw: number;
  score_max: number;
  duration_s: number;
  passed: boolean;
  created_at: string | null;
}

interface BenefitClaimRecord {
  claim_code: string;
  wallet: string;
  benefit_id: string;
  created_at: string | null;
}

const throwIfSupabaseError = (error: { message: string } | null, context: string) => {
  if (error) {
    throw new Error(`Supabase ${context}: ${error.message}`);
  }
};

const mapQuizItems = (rows: any[]): QuizItem[] =>
  rows.map((row) => ({
    id: row.quiz_item_id as string,
    stem: row.stem as string,
    answer_format: row.answer_format as QuizItem['answer_format'],
    correct_answer: row.correct_answer as QuizItem['correct_answer']
  }));

export const dataStore = {
  async getUserProfile(wallet: string): Promise<Maybe<{ wallet: string; display_name?: string }>> {
    const { data, error } = await supabaseClient
      .from('users')
      .select('wallet, display_name')
      .eq('wallet', wallet)
      .maybeSingle();
    throwIfSupabaseError(error, 'users.select');
    if (!data) return null;
    return {
      wallet: data.wallet as string,
      display_name: (data.display_name as string) ?? undefined
    };
  },

  async getUserRoles(wallet: string): Promise<string[]> {
    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('wallet', wallet);
    throwIfSupabaseError(error, 'user_roles.select');
    if (!data) return [];
    return data.map((row) => row.role as string);
  },

  async upsertCourse(course: { course_id: string; title: string; syllabus_url?: string | null; created_by: string }): Promise<void> {
    const { error } = await supabaseClient
      .from('courses')
      .upsert(
        {
          course_id: course.course_id,
          title: course.title,
          syllabus_url: course.syllabus_url ?? null,
          created_by: course.created_by
        },
        { onConflict: 'course_id' }
      );
    throwIfSupabaseError(error, 'courses.upsert');
  },

  async upsertModules(
    courseId: string,
    modules: { module_id: string; passing_rule_json: string; is_checkpoint: boolean }[]
  ): Promise<void> {
    if (!modules.length) return;
    const payload = modules.map((module) => ({
      course_id: courseId,
      module_id: module.module_id,
      passing_rule_json: module.passing_rule_json,
      is_checkpoint: module.is_checkpoint
    }));
    const { error } = await supabaseClient
      .from('modules')
      .upsert(payload, { onConflict: 'course_id,module_id' });
    throwIfSupabaseError(error, 'modules.upsert');
  },

  async createQuiz(record: QuizRecord, items: QuizItem[]): Promise<void> {
    const { error: quizError } = await supabaseClient
      .from('quizzes')
      .upsert(
        {
          quiz_id: record.quiz_id,
          course_id: record.course_id,
          module_id: record.module_id,
          expires_at: record.expires_at
        },
        { onConflict: 'quiz_id' }
      );
    throwIfSupabaseError(quizError, 'quizzes.upsert');

    await supabaseClient.from('quiz_items').delete().eq('quiz_id', record.quiz_id);

    if (!items.length) return;
    const payload = items.map((item) => ({
      quiz_item_id: item.id,
      quiz_id: record.quiz_id,
      stem: item.stem,
      answer_format: item.answer_format,
      correct_answer: item.correct_answer
    }));
    const { error: itemError } = await supabaseClient
      .from('quiz_items')
      .insert(payload);
    throwIfSupabaseError(itemError, 'quiz_items.insert');
  },

  async getQuizWithItems(quizId: string): Promise<Maybe<{ quiz: QuizRecord; items: QuizItem[] }>> {
    const { data: quiz, error: quizError } = await supabaseClient
      .from('quizzes')
      .select('quiz_id, course_id, module_id, expires_at')
      .eq('quiz_id', quizId)
      .maybeSingle();
    throwIfSupabaseError(quizError, 'quizzes.select');
    if (!quiz) return null;

    const { data: items, error: itemsError } = await supabaseClient
      .from('quiz_items')
      .select('quiz_item_id, stem, answer_format, correct_answer')
      .eq('quiz_id', quizId);
    throwIfSupabaseError(itemsError, 'quiz_items.select');

    return {
      quiz: {
        quiz_id: quiz.quiz_id as string,
        course_id: quiz.course_id as string,
        module_id: quiz.module_id as string,
        expires_at: quiz.expires_at as string
      },
      items: items ? mapQuizItems(items) : []
    };
  },

  async recordAttempt(attempt: {
    attempt_id: string;
    wallet: string;
    course_id: string;
    module_id: string;
    quiz_id: string;
    score_raw: number;
    score_max: number;
    duration_s: number;
    passed: boolean;
    request_id: string;
  }): Promise<void> {
    const { error } = await supabaseClient.from('attempts').insert({
      attempt_id: attempt.attempt_id,
      wallet: attempt.wallet,
      course_id: attempt.course_id,
      module_id: attempt.module_id,
      quiz_id: attempt.quiz_id,
      score_raw: attempt.score_raw,
      score_max: attempt.score_max,
      duration_s: attempt.duration_s,
      passed: attempt.passed,
      request_id: attempt.request_id
    });
    throwIfSupabaseError(error, 'attempts.insert');
  },

  async getProgressRecord(wallet: string, courseId: string, moduleId: string): Promise<Maybe<ProgressRecord>> {
    const { data, error } = await supabaseClient
      .from('progress')
      .select('wallet, course_id, module_id, latest_attempt_id, status, passed_at, version')
      .eq('wallet', wallet)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .maybeSingle();
    throwIfSupabaseError(error, 'progress.select');
    if (!data) return null;
    return {
      wallet: data.wallet as string,
      course_id: data.course_id as string,
      module_id: data.module_id as string,
      latest_attempt_id: (data.latest_attempt_id as string) ?? null,
      status: data.status as string,
      passed_at: (data.passed_at as string) ?? null,
      version: (data.version as number) ?? 1
    };
  },

  async upsertProgress(entry: {
    wallet: string;
    course_id: string;
    module_id: string;
    latest_attempt_id: string;
    status: string;
    passed_at: string | null;
  }): Promise<{ version: number; status: string }> {
    const existing = await this.getProgressRecord(entry.wallet, entry.course_id, entry.module_id);
    const version = (existing?.version ?? 0) + 1;
    const { data, error } = await supabaseClient
      .from('progress')
      .upsert(
        {
          wallet: entry.wallet,
          course_id: entry.course_id,
          module_id: entry.module_id,
          latest_attempt_id: entry.latest_attempt_id,
          status: entry.status,
          passed_at: entry.passed_at,
          version
        },
        { onConflict: 'wallet,course_id,module_id' }
      )
      .select();
    throwIfSupabaseError(error, 'progress.upsert');
    const returned = data && Array.isArray(data) && data.length > 0 ? (data[0] as Nullable<ProgressRecord>) : null;
    return {
      version: (returned?.version ?? version) as number,
      status: (returned?.status as string) ?? entry.status
    };
  },

  async listProgressByWallet(wallet: string): Promise<ProgressRecord[]> {
    const { data, error } = await supabaseClient
      .from('progress')
      .select('wallet, course_id, module_id, latest_attempt_id, status, passed_at, version')
      .eq('wallet', wallet);
    throwIfSupabaseError(error, 'progress.select');
    if (!data) return [];
    return data.map((row) => ({
      wallet: row.wallet as string,
      course_id: row.course_id as string,
      module_id: row.module_id as string,
      latest_attempt_id: (row.latest_attempt_id as string) ?? null,
      status: row.status as string,
      passed_at: (row.passed_at as string) ?? null,
      version: (row.version as number) ?? 1
    }));
  },

  async listAttemptsByWallet(wallet: string): Promise<AttemptRecord[]> {
    const { data, error } = await supabaseClient
      .from('attempts')
      .select('attempt_id, wallet, course_id, module_id, quiz_id, score_raw, score_max, duration_s, passed, created_at')
      .eq('wallet', wallet)
      .order('created_at', { ascending: false });
    throwIfSupabaseError(error, 'attempts.select');
    if (!data) return [];
    return data.map((row) => ({
      attempt_id: row.attempt_id as string,
      wallet: row.wallet as string,
      course_id: row.course_id as string,
      module_id: row.module_id as string,
      quiz_id: (row.quiz_id as string) ?? null,
      score_raw: row.score_raw as number,
      score_max: row.score_max as number,
      duration_s: row.duration_s as number,
      passed: Boolean(row.passed),
      created_at: (row.created_at as string) ?? null
    }));
  },

  async getIdempotentResponse(requestId: string): Promise<any | null> {
    const { data, error } = await supabaseClient
      .from('idempotency_store')
      .select('response_data')
      .eq('request_id', requestId)
      .maybeSingle();
    throwIfSupabaseError(error, 'idempotency_store.select');
    if (!data) return null;
    try {
      return JSON.parse(data.response_data as string);
    } catch {
      return null;
    }
  },

  async upsertIdempotentResponse(requestId: string, response: any): Promise<void> {
    const payload = JSON.stringify(response);
    const { error } = await supabaseClient
      .from('idempotency_store')
      .upsert({ request_id: requestId, response_data: payload }, { onConflict: 'request_id' });
    throwIfSupabaseError(error, 'idempotency_store.upsert');
  },

  async createBenefitClaim(entry: { claim_code: string; wallet: string; benefit_id: string }): Promise<void> {
    const payload = {
      claim_code: entry.claim_code,
      wallet: entry.wallet,
      benefit_id: entry.benefit_id
    };
    const { error } = await supabaseClient.from('benefit_claims').insert(payload);
    throwIfSupabaseError(error, 'benefit_claims.insert');
  },

  async listBenefitClaims(wallet: string): Promise<BenefitClaimRecord[]> {
    const { data, error } = await supabaseClient
      .from('benefit_claims')
      .select('claim_code, wallet, benefit_id, created_at')
      .eq('wallet', wallet)
      .order('created_at', { ascending: false });
    throwIfSupabaseError(error, 'benefit_claims.select');
    if (!data) return [];
    return data.map((row) => ({
      claim_code: row.claim_code as string,
      wallet: row.wallet as string,
      benefit_id: row.benefit_id as string,
      created_at: (row.created_at as string) ?? null
    }));
  },

  async updateProgressStatus(wallet: string, courseId: string, moduleId: string, status: string): Promise<void> {
    const { error } = await supabaseClient
      .from('progress')
      .update({ status })
      .eq('wallet', wallet)
      .eq('course_id', courseId)
      .eq('module_id', moduleId);
    throwIfSupabaseError(error, 'progress.update');
  },

  async listAvailableCourses(): Promise<Array<{ course_id: string; title: string; syllabus_url?: string; created_at: string }>> {
    const { data, error } = await supabaseClient
      .from('courses')
      .select('course_id, title, syllabus_url, created_at')
      .order('created_at', { ascending: false });
    throwIfSupabaseError(error, 'courses.select');
    if (!data) return [];
    return data.map((row) => ({
      course_id: row.course_id as string,
      title: row.title as string,
      syllabus_url: (row.syllabus_url as string) ?? undefined,
      created_at: row.created_at as string
    }));
  },

  async getCourseWithModules(courseId: string): Promise<Maybe<{ course: any; modules: any[] }>> {
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('course_id, title, syllabus_url, created_at, created_by')
      .eq('course_id', courseId)
      .maybeSingle();
    throwIfSupabaseError(courseError, 'courses.select');
    if (!course) return null;

    const { data: modules, error: modulesError } = await supabaseClient
      .from('modules')
      .select('module_id, passing_rule_json, is_checkpoint')
      .eq('course_id', courseId);
    throwIfSupabaseError(modulesError, 'modules.select');

    return {
      course: {
        course_id: course.course_id as string,
        title: course.title as string,
        syllabus_url: (course.syllabus_url as string) ?? null,
        created_at: course.created_at as string,
        created_by: course.created_by as string
      },
      modules: modules ? modules.map((row) => ({
        module_id: row.module_id as string,
        passing_rule_json: row.passing_rule_json,
        is_checkpoint: Boolean(row.is_checkpoint)
      })) : []
    };
  },

  async registerNewUser(wallet: string, displayName?: string): Promise<void> {
    // First create the user
    const { error: userError } = await supabaseClient
      .from('users')
      .upsert(
        {
          wallet,
          display_name: displayName ?? null
        },
        { onConflict: 'wallet' }
      );
    throwIfSupabaseError(userError, 'users.upsert');

    // Then assign LEARNER role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert(
        {
          wallet,
          role: 'LEARNER'
        },
        { onConflict: 'wallet,role' }
      );
    throwIfSupabaseError(roleError, 'user_roles.upsert');
  },

  async enrollInCourse(wallet: string, courseId: string, moduleId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('progress')
      .upsert(
        {
          wallet,
          course_id: courseId,
          module_id: moduleId,
          status: 'NOT_STARTED',
          version: 1
        },
        { onConflict: 'wallet,course_id,module_id' }
      );
    throwIfSupabaseError(error, 'progress.upsert');
  }
};

export type { QuizRecord, ProgressRecord, AttemptRecord, BenefitClaimRecord };
export default dataStore;
