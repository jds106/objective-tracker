import Anthropic from '@anthropic-ai/sdk';
import type {
  AiReviewResult,
  AiSuggestedObjective,
  AiSummaryResult,
  Objective,
  ObjectiveRepository,
  UserRepository,
} from '@objective-tracker/shared';
import { NotFoundError, ValidationError } from '@objective-tracker/shared';

export class AiService {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(
    apiKey: string,
    model: string,
    private readonly objectiveRepo: ObjectiveRepository,
    private readonly userRepo: UserRepository,
  ) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  /**
   * Review an objective for quality, returning a score, suggestions, and strengths.
   */
  async reviewObjective(objectiveId: string): Promise<AiReviewResult> {
    const objective = await this.objectiveRepo.getById(objectiveId);
    if (!objective) throw new NotFoundError('Objective not found');

    const prompt = this.buildReviewPrompt(objective);
    const content = await this.callClaude(prompt);
    return this.parseJson<AiReviewResult>(content, 'review');
  }

  /**
   * Suggest child objectives for a given parent objective.
   */
  async suggestObjectives(parentObjectiveId: string, context?: string): Promise<AiSuggestedObjective[]> {
    const parent = await this.objectiveRepo.getById(parentObjectiveId);
    if (!parent) throw new NotFoundError('Parent objective not found');

    const prompt = this.buildSuggestPrompt(parent, context);
    const content = await this.callClaude(prompt);
    return this.parseJson<AiSuggestedObjective[]>(content, 'suggest');
  }

  /**
   * Summarise a user's objectives for a given cycle.
   */
  async summarise(userId: string, cycleId: string): Promise<AiSummaryResult> {
    const objectives = await this.objectiveRepo.getByUserId(userId, cycleId);
    if (objectives.length === 0) {
      throw new ValidationError('No objectives found for this user and cycle');
    }

    let userName = 'Company';
    if (userId !== 'company') {
      const user = await this.userRepo.getById(userId);
      if (user) userName = user.displayName;
    }

    const prompt = this.buildSummarisePrompt(objectives, userName);
    const content = await this.callClaude(prompt);
    return this.parseJson<AiSummaryResult>(content, 'summarise');
  }

  // ── Private helpers ───────────────────────────────────────

  private async callClaude(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new ValidationError('AI returned an empty response');
    }
    return textBlock.text;
  }

  private parseJson<T>(content: string, context: string): T {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      throw new ValidationError(
        `AI response for ${context} was not valid JSON. Raw: ${content.substring(0, 200)}`,
      );
    }
  }

  private buildReviewPrompt(objective: Objective): string {
    const krList = objective.keyResults.length > 0
      ? objective.keyResults.map(kr =>
          `  - "${kr.title}" (type: ${kr.type}, progress: ${kr.progress}%)`
        ).join('\n')
      : '  (no key results defined yet)';

    return `You are an expert OKR coach reviewing an objective for quality. Be constructive, specific, and opinionated — coach the user towards better objectives.

Objective to review:
- Title: "${objective.title}"
- Description: "${objective.description || '(none provided)'}"
- Status: ${objective.status}
- Key Results:
${krList}

Evaluate this objective against these criteria:
1. **Clarity** — Is the objective clearly worded and unambiguous?
2. **Measurability** — Are the key results specific and measurable?
3. **Ambition** — Is it aspirational enough without being unrealistic?
4. **Specificity** — Does it avoid vague language like "improve", "better", "more"?
5. **Alignment** — Does it focus on outcomes rather than outputs?

Respond with ONLY a JSON object (no markdown, no explanation outside JSON) matching this exact structure:
{
  "score": <number 1-10>,
  "summary": "<one sentence summary of quality>",
  "suggestions": [
    {
      "category": "<clarity|measurability|ambition|alignment|specificity>",
      "message": "<specific, actionable suggestion>",
      "rewrite": "<optional improved version>"
    }
  ],
  "strengths": ["<what's good about this objective>"]
}`;
  }

  private buildSuggestPrompt(parent: Objective, context?: string): string {
    const krList = parent.keyResults.length > 0
      ? parent.keyResults.map(kr =>
          `  - "${kr.title}" (type: ${kr.type})`
        ).join('\n')
      : '  (no key results)';

    return `You are an expert OKR coach. A manager has set the following objective and wants to suggest 2–3 supporting objectives for their direct reports.

Parent Objective:
- Title: "${parent.title}"
- Description: "${parent.description || '(none)'}"
- Key Results:
${krList}

${context ? `Additional context: ${context}` : ''}

Generate 2–3 child objectives that would directly contribute to achieving the parent objective. Each should:
- Be outcome-focused (what changes, not what you do)
- Have a clear causal link to the parent
- Include 2–3 suggested key results with appropriate types

Respond with ONLY a JSON array (no markdown, no explanation outside JSON) matching this structure:
[
  {
    "title": "<objective title>",
    "description": "<brief description>",
    "suggestedKeyResults": [
      {
        "title": "<key result title>",
        "type": "<percentage|metric|milestone|binary>"
      }
    ],
    "rationale": "<why this supports the parent>"
  }
]`;
  }

  private buildSummarisePrompt(objectives: Objective[], userName: string): string {
    const objList = objectives.map(obj => {
      const progress = obj.keyResults.length > 0
        ? Math.round(obj.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / obj.keyResults.length)
        : 0;
      const krDetails = obj.keyResults.map(kr =>
        `    - "${kr.title}" — ${kr.progress}% (${kr.type})`
      ).join('\n');

      return `- "${obj.title}" (status: ${obj.status}, overall progress: ${progress}%)
${krDetails || '    (no key results)'}`;
    }).join('\n\n');

    return `You are an expert OKR coach preparing a cycle review summary for ${userName}.

Objectives this cycle:
${objList}

Provide a comprehensive review summary. Be honest and specific — flag what's at risk, celebrate what's going well, and give actionable recommendations.

Respond with ONLY a JSON object (no markdown, no explanation outside JSON) matching this exact structure:
{
  "overview": "<2-3 sentence high-level summary>",
  "highlights": ["<specific wins and progress>"],
  "atRisk": [
    {
      "objectiveTitle": "<title of at-risk objective>",
      "reason": "<why it's at risk>",
      "recommendation": "<what to do about it>"
    }
  ],
  "recommendations": ["<actionable next-cycle recommendations>"]
}`;
  }
}
