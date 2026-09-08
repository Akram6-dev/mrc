import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTIFICATIONS_PATH = path.join(process.cwd(), 'database', 'notifications.json');

export async function GET(req: Request) {
  const { signal } = req;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function sendEvent(data: any) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Send existing notifications once
      try {
        const raw = fs.existsSync(NOTIFICATIONS_PATH) ? fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8') : '[]';
        const arr = JSON.parse(raw || '[]');
        sendEvent({ type: 'initial', notifications: arr.slice(0, 20) });
      } catch (e) {
        // ignore
      }

      // Watch file for changes
      let fsWatcher: fs.FSWatcher | null = null;
      try {
        fsWatcher = fs.watch(NOTIFICATIONS_PATH, (eventType) => {
          if (eventType === 'change') {
            try {
              const raw = fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8');
              const arr = JSON.parse(raw || '[]');
              sendEvent({ type: 'update', notifications: arr.slice(0, 20) });
            } catch (e) {
              // ignore parse errors
            }
          }
        });
      } catch (e) {
        // file may not exist yet
      }

      // cleanup on client disconnect
      signal.addEventListener('abort', () => {
        if (fsWatcher) fsWatcher.close();
        try { controller.close(); } catch (e) { /* ignore */ }
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
