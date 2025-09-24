import * as dotenv from 'dotenv'

import fastify from 'fastify'
import { Contact } from './Contact'
import prisma from './prisma'

dotenv.config()

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = fastify()

server.register(import('fastify-healthcheck'));

server.get('/', async () => {
    return { message: 'Welcome to the Contacts API' };
});

server.get('/contacts', async () => {
    const contacts: Contact[] = (await prisma.contact.findMany()).map((c: any) => new Contact(
        c.id,
        c.firstName,
        c.lastName,
        c.phoneNumber,
        c.email,
        c.createdAt,
        c.updatedAt
    ));
    return contacts;
})

server.post('/contacts', async (request, reply) => {
    const { firstName, lastName, phoneNumber, email } = request.body as {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
    };

    const newContact = await prisma.contact.create({
        data: {
            firstName,
            lastName,
            phoneNumber,
            email,
        },
    });

    reply.code(201).send(newContact);
});

server.get('/contacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const contact = await prisma.contact.findUnique({
        where: { id: Number(id) },
    });

    if (contact) {
        reply.code(200).send(contact);
    } else {
        reply.code(404).send({ error: 'Contact not found' });
    }
});

server.delete('/contacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
        const deletedContact = await prisma.contact.delete({
            where: { id: Number(id) },
        });
        reply.code(200).send(deletedContact);
    } catch (error) {
        console.error(error);
        reply.code(404).send({ error: 'Contact not found' });
    }
});

server.put('/contacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { firstName, lastName, phoneNumber, email } = request.body as {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        email?: string;
    };

    try {
        const data: {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            email?: string;
        } = {};
        if (firstName !== undefined) data.firstName = firstName;
        if (lastName !== undefined) data.lastName = lastName;
        if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
        if (email !== undefined) data.email = email;

        const updatedContact = await prisma.contact.update({
            where: { id: Number(id) },
            data,
        });
        reply.code(200).send(updatedContact);
    } catch (error) {
        console.error(error);
        reply.code(404).send({ error: 'Contact not found' });
    }
});

server.post('/api/chat', async (request, reply) => {
    type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: unknown };
    const body = request.body as {
        messages?: ChatMessage[];
        prompt?: string;
    } | undefined;

    const rawMessages: ChatMessage[] = body?.messages
        ? body.messages
        : body?.prompt
        ? [{ role: 'user', content: body.prompt }]
        : [];

    if (!rawMessages.length) {
        return reply.code(400).send({ error: 'Provide messages[] or prompt' });
    }

    // Normalize content to a plain string for Ollama
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

    // Helper: extremely simple local reply that mimics a helpful assistant
    const localReply = (history: ChatMessage[]) => {
        const last = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';
        const text = typeof last === 'string' ? last : String(last);
        const prefix = 'Assistant (local minimal):';
        if (!text.trim()) return `${prefix} Bonjour ! Comment puis-je vous aider ?`;
        // Tiny heuristic: answer with a short acknowledgement and a paraphrase
        return `${prefix} Voici une réponse simple à votre message: "${text}"`;
    };

    // Try local Ollama first; fall back to local minimal reply on any error
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
            try { errorText = await response.text(); } catch {}
            console.error(`Ollama HTTP ${response.status}: ${errorText || response.statusText}`);
            return reply.send({
                role: 'assistant',
                content: localReply(messages),
                meta: { provider: 'local-fallback', status: response.status, error: debug ? (errorText || response.statusText) : undefined },
            });
        }

        const data = await response.json();
        const content: string | undefined = data?.message?.content;
        return reply.send({ role: 'assistant', content: content ?? localReply(messages), meta: { provider: 'ollama', model } });
    } catch (err) {
        console.error('Ollama error:', err);
        return reply.send({ role: 'assistant', content: localReply(messages), meta: { provider: 'local-fallback', error: debug ? String(err) : undefined } });
    }
});

server.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
