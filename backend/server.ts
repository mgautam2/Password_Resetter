import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 4000;

const io = new Server(createServer(), {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log(`[server] connected  ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`[server] disconnected ${socket.id} — ${reason}`);
  });

  socket.on('start_reset', () => {
    console.log(`[server] start_reset from ${socket.id}`);
    // AgentSession wired here next
  });
});

io.httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
