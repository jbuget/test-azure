import { FastifyInstance } from 'fastify';
import { Contact } from '../../../domain/Contact';
import prisma from '../../../infrastructure/prisma';
import { deleteBlob, getBlobDownload, uploadBuffer } from '../../../infrastructure/azureBlob';
import { randomUUID } from 'crypto';

export default async function contactsRoutes(server: FastifyInstance) {

    // Web: GET /contacts — server-side render list
    server.get('/contacts', async (_req, reply) => {
        const rows = await prisma.contact.findMany({ orderBy: { id: 'asc' } });
        const contacts: Contact[] = rows.map((c: any) => new Contact(c.id, c.firstName, c.lastName, c.phoneNumber, c.email, c.createdAt, c.updatedAt, c.photo));
        return reply.view('contacts/index.ejs', { contacts });
    });

    // Web: GET /contact/new — show form (fetch to API on submit)
    server.get('/contact/new', async (_req, reply) => {
        return reply.view('contacts/new.ejs');
    });

    // Web: GET /contact/:id — detail
    server.get('/contact/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const contact = await prisma.contact.findUnique({ where: { id: Number(id) } });
        if (!contact) return reply.code(404).view('contacts/show.ejs', { notFound: true, id });
        return reply.view('contacts/show.ejs', { contact, notFound: false });
    });

    // Web: GET /contact/:id/edit — edit form (fetch to API on submit)
    server.get('/contact/:id/edit', async (req, reply) => {
        const { id } = req.params as { id: string };
        const contact = await prisma.contact.findUnique({ where: { id: Number(id) } });
        if (!contact) return reply.code(404).view('contacts/edit.ejs', { notFound: true, id });
        return reply.view('contacts/edit.ejs', { contact, notFound: false });
    });

    // Media: GET /media/contacts/:id — stream contact photo if any
    server.get('/media/contacts/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const contact = await prisma.contact.findUnique({ where: { id: Number(id) } });
        const blobName = (contact as any)?.photo ?? null;
        if (!blobName) return reply.code(404).send({ error: 'No photo' });
        const dl = await getBlobDownload(blobName);
        if (!dl) return reply.code(404).send({ error: 'Not found' });
        reply.header('Content-Type', dl.contentType);
        if (dl.contentLength) reply.header('Content-Length', dl.contentLength);
        if (dl.etag) reply.header('ETag', dl.etag);
        return reply.send(dl.stream);
    });

    // GET /api/contacts
    server.get('/api/contacts', async () => {
        const contacts: Contact[] = (await prisma.contact.findMany()).map((c: any) =>
            new Contact(c.id, c.firstName, c.lastName, c.phoneNumber, c.email, c.createdAt, c.updatedAt, c.photo)
        );
        return contacts;
    });

    // POST /api/contacts
    server.post('/api/contacts', async (request, reply) => {
        const { firstName, lastName, phoneNumber, email } = request.body as {
            firstName: string;
            lastName: string;
            phoneNumber: string;
            email: string;
        };

        const newContact = await prisma.contact.create({
            data: { firstName, lastName, phoneNumber, email },
        });

        reply.code(201).send(newContact);
    });

    // GET /api/contacts/:id
    server.get('/api/contacts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const contact = await prisma.contact.findUnique({ where: { id: Number(id) } });

        if (contact) {
            reply.code(200).send(contact);
        } else {
            reply.code(404).send({ error: 'Contact not found' });
        }
    });

    // DELETE /api/contacts/:id
    server.delete('/api/contacts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            const deletedContact = await prisma.contact.delete({ where: { id: Number(id) } });
            reply.code(200).send(deletedContact);
        } catch (error) {
            console.error(error);
            reply.code(404).send({ error: 'Contact not found' });
        }
    });

    // PUT /api/contacts/:id
    server.put('/api/contacts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { firstName, lastName, phoneNumber, email } = request.body as {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            email?: string;
        };

        try {
            const data: { firstName?: string; lastName?: string; phoneNumber?: string; email?: string } = {};
            if (firstName !== undefined) data.firstName = firstName;
            if (lastName !== undefined) data.lastName = lastName;
            if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
            if (email !== undefined) data.email = email;

            const updatedContact = await prisma.contact.update({ where: { id: Number(id) }, data });
            reply.code(200).send(updatedContact);
        } catch (error) {
            console.error(error);
            reply.code(404).send({ error: 'Contact not found' });
        }
    });

    // POST /api/contacts/:id/photo — upload/replace profile photo
    server.post('/api/contacts/:id/photo', async (request, reply) => {
        const { id } = request.params as { id: string };
        const file = await (request as any).file();
        if (!file) return reply.code(400).send({ error: 'file is required' });
        const contact = await prisma.contact.findUnique({ where: { id: Number(id) } });
        if (!contact) return reply.code(404).send({ error: 'Contact not found' });

        const chunks: Buffer[] = [];
        for await (const chunk of file.file) chunks.push(chunk as Buffer);
        const buffer = Buffer.concat(chunks);
        const ext = (file.filename?.split('.').pop() || '').toLowerCase();
        const safeExt = ext && ext.length <= 5 ? `.${ext}` : '';
        const blobName = `contacts/${id}/${randomUUID()}${safeExt}`;
        await uploadBuffer(blobName, buffer, file.mimetype);

        // delete previous if any
        if ((contact as any).photo) {
            try { await deleteBlob((contact as any).photo); } catch {}
        }
        const updated = await prisma.contact.update({ where: { id: Number(id) }, data: { photo: blobName } as any });
        return reply.code(201).send({ ok: true, contact: updated });
    });

    // DELETE /api/contacts/:id/photo — remove profile photo
    server.delete('/api/contacts/:id/photo', async (request, reply) => {
        const { id } = request.params as { id: string };
        const contact = await prisma.contact.findUnique({ where: { id: Number(id) } });
        if (!contact) return reply.code(404).send({ error: 'Contact not found' });
        if ((contact as any).photo) {
            try { await deleteBlob((contact as any).photo); } catch (e) { console.error(e); }
        }
        const updated = await prisma.contact.update({ where: { id: Number(id) }, data: { photo: null } as any });
        return reply.send({ ok: true, contact: updated });
    });
}
