import { v4 as uuidv4 } from 'uuid';
import { generateReadinessQuiz, scoreQuizAttempt, generateAttestationProof } from './quiz';
import { authManager } from './auth-client';
import { dataStore } from './storage';

const MUTATING_ENDPOINTS = new Set([
  'register_course',
  'generate_quiz',
  'score_attempt',
  'update_progress',
  'issue_attestation',
  'grant_benefit'
]);

export class ApiClient {
  private async makeRequest(endpoint: string, data: any, requiredRoles: string[] = []) {
    const user = authManager.getCurrentUser();

    if (!user) {
      throw new Error('Authentication required');
    }

    if (requiredRoles.length > 0 && !authManager.hasAnyRole(requiredRoles)) {
      throw new Error(`Insufficient permissions. Required: ${requiredRoles.join(', ')}`);
    }

    const requestId = this.extractRequestId(endpoint, data);

    if (requestId && MUTATING_ENDPOINTS.has(endpoint)) {
      const cached = await dataStore.getIdempotentResponse(requestId);
      if (cached) {
        return cached;
      }
    }

    const response = await this.processRequest(endpoint, { ...data, request_id: requestId }, user);

    if (requestId && response) {
      await dataStore.upsertIdempotentResponse(requestId, response);
    }

    return response;
  }

  private extractRequestId(endpoint: string, data: any) {
    const incoming = data?.request_id ?? data?.requestId;
    if (incoming) {
      return incoming;
    }

    if (MUTATING_ENDPOINTS.has(endpoint)) {
      return uuidv4();
    }

    return undefined;
  }

  private async processRequest(endpoint: string, data: any, user: any) {
    switch (endpoint) {
      case 'register_course':
        return this.processRegisterCourse(data, user);
      case 'generate_quiz':
        return this.processGenerateQuiz(data);
      case 'score_attempt':
        return this.processScoreAttempt(data, user);
      case 'update_progress':
        return this.processUpdateProgress(data);
      case 'issue_attestation':
        return this.processIssueAttestation(data);
      case 'grant_benefit':
        return this.processGrantBenefit(data);
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  }

  async registerCourse(data: any) {
    return this.makeRequest(
      'register_course',
      { ...data, request_id: data?.request_id ?? uuidv4() },
      ['TUTOR', 'PLATFORM_ADMIN']
    );
  }

  private async processRegisterCourse(data: any, user: any) {
    const { course_id, title, syllabus_url, checkpoints = [] } = data;

    await dataStore.upsertCourse({
      course_id,
      title,
      syllabus_url,
      created_by: user.wallet
    });

    const modules = checkpoints.map((checkpoint: any) => ({
      module_id: checkpoint.module_id,
      passing_rule_json: JSON.stringify(checkpoint.passingRule ?? {}),
      is_checkpoint: Boolean(checkpoint.is_checkpoint)
    }));

    await dataStore.upsertModules(course_id, modules);

    return { ok: true, version: 1 };
  }

  async generateQuiz(data: any) {
    return this.makeRequest(
      'generate_quiz',
      { ...data, request_id: data?.request_id ?? uuidv4() },
      ['LEARNER', 'SYSTEM', 'TUTOR', 'PLATFORM_ADMIN']
    );
  }

  private async processGenerateQuiz(data: any) {
    const { course_id, module_id } = data;
    const quiz = generateReadinessQuiz();

    await dataStore.createQuiz(
      {
        quiz_id: quiz.quiz_id,
        course_id,
        module_id,
        expires_at: quiz.expires_at
      },
      quiz.items
    );

    return {
      quiz_id: quiz.quiz_id,
      items: quiz.items.map((item) => ({
        id: item.id,
        stem: item.stem,
        answer_format: item.answer_format
      })),
      expires_at: quiz.expires_at
    };
  }

  async scoreAttempt(data: any) {
    return this.makeRequest(
      'score_attempt',
      { ...data, request_id: data?.request_id ?? uuidv4() },
      ['LEARNER', 'SYSTEM', 'TUTOR', 'PLATFORM_ADMIN']
    );
  }

  private async processScoreAttempt(data: any, user: any) {
    const { quiz_id, answers, started_at, submitted_at, request_id } = data;

    const quizRecord = await dataStore.getQuizWithItems(quiz_id);
    if (!quizRecord) {
      throw new Error('Quiz not found');
    }

    const result = scoreQuizAttempt(quizRecord.items, answers, started_at, submitted_at);
    const attemptId = uuidv4();

    await dataStore.recordAttempt({
      attempt_id: attemptId,
      wallet: user.wallet,
      course_id: quizRecord.quiz.course_id,
      module_id: quizRecord.quiz.module_id,
      quiz_id,
      score_raw: result.score_raw,
      score_max: result.score_max,
      duration_s: result.duration_s,
      passed: result.passed,
      request_id
    });

    return {
      attempt_id: attemptId,
      ...result
    };
  }

  async updateProgress(data: any) {
    return this.makeRequest(
      'update_progress',
      { ...data, request_id: data?.request_id ?? uuidv4() },
      ['LEARNER', 'SYSTEM', 'PLATFORM_ADMIN']
    );
  }

  private async processUpdateProgress(data: any) {
    const { learner_addr, course_id, module_id, attempt_id, passed } = data;

    const status = passed ? 'READY' : 'IN_PROGRESS';
    const passedAt = passed ? new Date().toISOString() : null;

    const { version, status: storedStatus } = await dataStore.upsertProgress({
      wallet: learner_addr,
      course_id,
      module_id,
      latest_attempt_id: attempt_id,
      status,
      passed_at: passedAt
    });

    return {
      progress_version: version,
      status: storedStatus
    };
  }

  async issueAttestation(data: any) {
    return this.makeRequest(
      'issue_attestation',
      { ...data, request_id: data?.request_id ?? uuidv4() },
      ['LEARNER', 'SYSTEM', 'TUTOR', 'PLATFORM_ADMIN']
    );
  }

  private async processIssueAttestation(data: any) {
    const { learner_addr, course_id, module_id, score_pct, passed_at } = data;
    const proofHash = await generateAttestationProof(learner_addr, course_id, module_id, score_pct, passed_at);

    return {
      proof_hash: proofHash,
      eas_uid: null
    };
  }

  async grantBenefit(data: any) {
    return this.makeRequest(
      'grant_benefit',
      { ...data, request_id: data?.request_id ?? uuidv4() },
      ['LEARNER', 'BENEFITS_ADMIN', 'SYSTEM', 'PLATFORM_ADMIN']
    );
  }

  private async processGrantBenefit(data: any) {
    const { learner_addr, benefit_id } = data;

    const progress = await dataStore.getProgressRecord(learner_addr, 'MATH101', 'readiness');
    if (!progress || (progress.status !== 'READY' && progress.status !== 'BENEFIT_CLAIMED')) {
      throw new Error('Learner must complete readiness checkpoint first');
    }

    const claimCode = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

    await dataStore.createBenefitClaim({
      claim_code: claimCode,
      wallet: learner_addr,
      benefit_id
    });

    await dataStore.updateProgressStatus(learner_addr, 'MATH101', 'readiness', 'BENEFIT_CLAIMED');

    return { claim_code: claimCode };
  }
}

export const apiClient = new ApiClient();
