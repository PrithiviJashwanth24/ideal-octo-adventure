import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { typeDefs } from './api/graphql/schemas';
import { resolvers } from './api/graphql/resolvers';
import { createContext } from './api/graphql/context';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { authRouter } from './api/rest/auth';
import { uploadRouter } from './api/rest/upload';
import { webhookRouter } from './api/rest/webhooks';
import { healthRouter } from './api/rest/health';
import { initializeJobs } from './jobs';
import { errorHandler } from './middleware/errorHandler';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  }));
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // REST routes (auth, file upload, stripe webhooks)
  app.use('/api/auth', authRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/webhooks', webhookRouter);
  app.use('/health', healthRouter);

  // GraphQL schema with subscriptions
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer({ schema, context: createContext }, wsServer);

  const apolloServer = new ApolloServer({
    schema,
    context: createContext,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (error) => {
      logger.error('GraphQL Error', { error });
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql', cors: false });

  app.use(errorHandler);

  initializeJobs();

  httpServer.listen(PORT, () => {
    logger.info(`🚀 FitCheck API running at http://localhost:${PORT}/graphql`);
    logger.info(`⚡ WebSocket server ready at ws://localhost:${PORT}/graphql`);
  });

  const shutdown = async () => {
    logger.info('Shutting down gracefully…');
    await apolloServer.stop();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
