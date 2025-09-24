import { FastifyInstance } from 'fastify';

export default async function rootRoutes(server: FastifyInstance) {

  // GET /
  server.get('/', async () => {
    return { message: 'Welcome to the Azure Test app' };
  });
}

