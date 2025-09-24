import * as dotenv from 'dotenv'

import fastify from 'fastify'
import contactsRoutes from './interface/http/routes/contacts'
import chatbotRoutes from './interface/http/routes/chatbot'
import rootRoutes from './interface/http/routes/index'

dotenv.config()

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = fastify()

server.register(import('fastify-healthcheck'));
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
