import { FastifyInstance } from 'fastify';

export default async function chatbotRoutes(server: FastifyInstance) {
  // POST /api/chat
  server.post('/api/chat', async (request, reply) => {
    type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: unknown };
    const body = (request.body as { messages?: ChatMessage[]; prompt?: string } | undefined) ?? {};

    const rawMessages: ChatMessage[] = body.messages
      ? body.messages
      : body.prompt
      ? [{ role: 'user', content: body.prompt }]
      : [];

    if (!rawMessages.length) {
      return reply.code(400).send({ error: 'Provide messages[] or prompt' });
    }

    const normalizeContent = (c: unknown): string => {
      if (typeof c === 'string') return c;
      if (Array.isArray(c)) {
        const parts = c.map((p) => {
          if (typeof p === 'string') return p;
          if (p && typeof p === 'object') {
            const anyP: any = p;
            if (typeof anyP.text === 'string') return anyP.text;
            if (typeof anyP.content === 'string') return anyP.content;
            return JSON.stringify(anyP);
          }
          return String(p);
        });
        return parts.join(' ');
      }
      if (c && typeof c === 'object') {
        const anyC: any = c as any;
        if (typeof anyC.text === 'string') return anyC.text;
        if (typeof anyC.content === 'string') return anyC.content;
        return JSON.stringify(anyC);
      }
      return String(c ?? '');
    };

    const messages = rawMessages.map((m) => ({ role: m.role, content: normalizeContent(m.content) }));

    const localReply = (history: ChatMessage[]) => {
      const last = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';
      const text = typeof last === 'string' ? last : String(last);
      const prefix = 'Assistant (local minimal):';
      if (!text.trim()) return `${prefix} Bonjour ! Comment puis-je vous aider ?`;
      return `${prefix} Voici une réponse simple à votre message: "${text}"`;
    };

    const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL ?? 'llama3.1:8b';
    const debug = process.env.CHATBOT_DEBUG === 'true';

    console.log(`Ollama: ${baseUrl}, model: ${model}, debug: ${debug}`);

    try {
      const response = await (globalThis as any).fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false }),
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {}
        console.error(`Ollama HTTP ${response.status}: ${errorText || response.statusText}`);
        return reply.send({
          role: 'assistant',
          content: localReply(messages),
          meta: {
            provider: 'local-fallback',
            status: response.status,
            error: debug ? errorText || response.statusText : undefined,
          },
        });
      }

      const data = await response.json();
      const content: string | undefined = data?.message?.content;
      return reply.send({ role: 'assistant', content: content ?? localReply(messages), meta: { provider: 'ollama', model } });
    } catch (err) {
      console.error('Ollama error:', err);
      return reply.send({
        role: 'assistant',
        content: localReply(messages),
        meta: { provider: 'local-fallback', error: debug ? String(err) : undefined },
      });
    }
  });
}
