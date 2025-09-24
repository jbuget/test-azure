import * as dotenv from 'dotenv'
import * as path from 'path'

import ejs from 'ejs'
import fastify from 'fastify'
import multipart from '@fastify/multipart'
import view from '@fastify/view'

import contactsRoutes from './interface/http/routes/contacts'
import chatbotRoutes from './interface/http/routes/chatbot'
import rootRoutes from './interface/http/routes/index'

dotenv.config()

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = fastify({ logger: true });

server.register(import('fastify-healthcheck'));
server.register(multipart);
server.register(view, {
  engine: { ejs },
  // Point to the EJS files under src/ for dev and prod (cwd = repo root)
  root: path.join(process.cwd(), 'src/interface/http/views'),
});
server.register(rootRoutes);
server.register(contactsRoutes);
server.register(chatbotRoutes);

server.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
