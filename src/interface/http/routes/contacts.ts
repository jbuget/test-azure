import { FastifyInstance } from 'fastify';
import { Contact } from '../../../domain/Contact';
import prisma from '../../../infrastructure/prisma';

export default async function contactsRoutes(server: FastifyInstance) {

    // GET /api/contacts
    server.get('/api/contacts', async () => {
        const contacts: Contact[] = (await prisma.contact.findMany()).map((c: any) =>
            new Contact(c.id, c.firstName, c.lastName, c.phoneNumber, c.email, c.createdAt, c.updatedAt)
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
}
