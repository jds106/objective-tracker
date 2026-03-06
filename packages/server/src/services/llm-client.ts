import Anthropic from '@anthropic-ai/sdk';

/**
 * Thin abstraction over LLM providers. Each implementation takes a prompt
 * and returns the text completion.
 */
export interface LlmClient {
  complete(prompt: string): Promise<string>;
}

/** Anthropic Claude via the official SDK */
export class AnthropicLlmClient implements LlmClient {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('AI returned an empty response');
    }
    return textBlock.text;
  }
}

/** Ollama via its OpenAI-compatible API */
export class OllamaLlmClient implements LlmClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly model: string,
  ) {
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async complete(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${body}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Ollama returned an empty response');
    }
    return content;
  }
}
