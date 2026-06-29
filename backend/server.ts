import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import chalk from 'chalk';
import { AgentSession } from './agent/session.js';
import { checkAuth, waitForAuthById } from './agent/arcade.js';

const PORT = process.env.PORT || 4000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.on('connection', async (socket) => {
  console.log(`[server] connected  ${socket.id}`);
  let current: AgentSession | null = null;
  let gmailAuthorized = false;

  // Check auth immediately on connect
  try {
    const auth = await checkAuth();
    gmailAuthorized = auth.authorized;
    socket.emit('auth_status', { authorized: auth.authorized });
    console.log(chalk.cyan(`[auth] status=${auth.authorized ? 'authorized' : 'pending'}`));
  } catch (err) {
    console.error('[auth] checkAuth failed', err);
    socket.emit('auth_status', { authorized: false });
  }

  socket.on('disconnect', (reason) => {
    console.log(`[server] disconnected ${socket.id} — ${reason}`);
    current?.stop();
    current = null;
  });

  socket.on('authorize_gmail', async () => {
    console.log(chalk.cyan(`[auth] authorize_gmail requested`));
    try {
      const auth = await checkAuth();
      if (auth.authorized) {
        gmailAuthorized = true;
        socket.emit('auth_status', { authorized: true });
        return;
      }
      socket.emit('auth_status', { authorized: false, url: auth.url });
      if (!auth.id) throw new Error('No auth ID returned');
      await waitForAuthById(auth.id);
      gmailAuthorized = true;
      console.log(chalk.green(`[auth] Gmail authorized for ${socket.id}`));
      socket.emit('auth_status', { authorized: true });
    } catch (err) {
      console.error('[auth] authorize_gmail failed', err);
    }
  });

  socket.on('start_reset', () => {
    if (!gmailAuthorized) {
      socket.emit('session_stuck', { reason: 'Connect Gmail first' });
      return;
    }
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
