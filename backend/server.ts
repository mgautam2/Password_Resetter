import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AgentSession } from './agent/session.js';

const PORT = process.env.PORT || 4000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log(`[server] connected  ${socket.id}`);
  let current: AgentSession | null = null; 

  socket.on('disconnect', (reason) => {
    console.log(`[server] disconnected ${socket.id} — ${reason}`);
    current?.stop();
    current = null;
  });

  socket.on('start_reset', () => {
    console.log(`[server] start_reset from ${socket.id}`);
    current?.stop();
    current = new AgentSession(socket);
    current.run().catch((err) => {
      if (err?.message === 'aborted') {
        console.log('[server] session aborted');
        return;
      }
      console.error('[server] session error', err);
      socket.emit('session_stuck', { reason: 'Internal agent error' });
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
