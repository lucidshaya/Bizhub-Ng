// ─── Fix broken system DNS (use Google DNS so Supabase hostnames resolve) ───
import * as dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

import { Express } from 'express';

// Cached handler for Vercel Serverless Function
let cachedHandler: Express;

async function bootstrap(): Promise<Express> {
  if (cachedHandler) return cachedHandler;

  const server = express();

  // ─── X-Request-ID Middleware ─────────────────────────────────────────────────
  server.use((_req, res, next) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // Ensure uploads directory exists (use /tmp on Vercel)
  const isVercel = !!process.env.VERCEL;
  const uploadsDir = isVercel
    ? join('/tmp', 'uploads')
    : join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {
      console.warn('Could not create uploads directory:', e);
    }
  }
  // Serve uploaded files statically
  server.use('/uploads', express.static(uploadsDir));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS for frontend
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow localhost frontend development
      if (origin.includes('localhost') || origin.includes('127.0.0.1'))
        return callback(null, true);
      // Allow ALL vercel deployments
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Default to env
      if (origin === process.env.FRONTEND_URL) return callback(null, true);

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: '*',
    exposedHeaders: ['X-Request-ID'],
  });

  // API prefix
  app.setGlobalPrefix('api');

  await app.init();
  cachedHandler = server;
  return server;
}

// Export the handler for Vercel
export default async (req: express.Request, res: express.Response) => {
  const handler = await bootstrap();
  handler(req, res);
};

// ─── Local development ───────────────────────────────────────────────────────
// Use a dedicated NestApplication with app.listen() so Socket.io attaches
// correctly to the underlying HTTP server. The Vercel export above uses
// app.init() which skips the HTTP server binding — fine for serverless but
// breaks WebSocket gateways locally.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT || 3333;

  (async () => {
    const server = express();

    server.use((_req, res, next) => {
      const requestId = randomUUID();
      res.setHeader('X-Request-ID', requestId);
      next();
    });

    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    const uploadsDir = join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (e) {
        console.warn('Could not create uploads directory:', e);
      }
    }
    server.use('/uploads', express.static(uploadsDir));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) return callback(null, true);
        if (origin.includes('localhost') || origin.includes('127.0.0.1'))
          return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (origin === process.env.FRONTEND_URL) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: '*',
      exposedHeaders: ['X-Request-ID'],
    });

    app.setGlobalPrefix('api');

    // app.listen() — NOT app.init() — so Socket.io attaches to the HTTP server
    await app.listen(port);
    console.log(`🚀 Local server is running on: http://localhost:${port}/api`);
  })().catch((err) => {
    console.error('Error starting local server:', err);
  });
}
