import * as dotenv from 'dotenv'

import fastify from 'fastify'
import { Contact } from './Contact'
import prisma from './prisma'

dotenv.config()

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || 'localhost';

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

server.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
