import Database from 'better-sqlite3';
import { IPCRequest, IPCResponse } from '../types';
import * as net from 'net';

// const IPC_PORT = parseInt(import.meta.env.VITE_ELECTRON_BRIDGE_PORT || '12346', 10);
const IPC_PORT = parseInt('12346', 10);
const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

type RequestHandler = (
  dbInstance: Database.Database,
  req: IPCRequest
) => Promise<IPCResponse | null>;

const safeJSONParse = (s: string): any => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

/**
 * Start a pure TCP server.
 * You pass in an async handler that will process the data.
 */
export function startIPCServer(dbInstance: Database.Database, handler: RequestHandler): net.Server {
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    let buffer = '';

    socket.on('data', async (chunk: string) => {
      buffer += chunk;

      if (buffer.length > MAX_REQUEST_BYTES) {
        socket.end(
          JSON.stringify({
            id: 'unknown',
            ok: false,
            reason: 'message_too_large'
          }) + '\n'
        );
        socket.destroy();
        return;
      }

      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);

        if (!raw.trim()) continue;

        const req = safeJSONParse(raw) as IPCRequest | null;
        if (!req || typeof req.id !== 'string') {
          socket.write(
            JSON.stringify({
              id: req?.id || 'unknown',
              ok: false,
              reason: 'invalid_request'
            }) + '\n'
          );
          continue;
        }

        try {
          const res = await handler(dbInstance, req);
          socket.write(JSON.stringify(res) + '\n');
        } catch {
          socket.write(
            JSON.stringify({
              id: req.id,
              ok: false,
              reason: 'internal_error'
            }) + '\n'
          );
        }
      }
    });

    socket.on('error', (err) => {
      console.log('Socket error:', err);
    });

    socket.on('close', () => {
      console.log('Connection closed');
    });
  });

  server.on('error', (err) => {
    console.log('Server error:', err);
  });

  server.listen(IPC_PORT, '127.0.0.1', () => {
    console.log(`IPC server running on 127.0.0.1:${IPC_PORT}`);
  });

  return server;
}
