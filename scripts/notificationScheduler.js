const fs = require("fs");
const path = require("path");

const loansPath = path.join(__dirname, "..", "database", "loans.json");
const notificationsPath = path.join(__dirname, "..", "database", "notifications.json");

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function addNotification(message, type, slot = null) {
  const notifications = readJSON(notificationsPath);
  const obj = {
    id: Date.now(),
    message,
    type,
    read: false,
    timestamp: new Date().toISOString(),
  };
  if (slot) obj.slot = slot;
  notifications.unshift(obj);
  writeJSON(notificationsPath, notifications);
}

function runScheduler() {
  const now = new Date();
  // track last weekend skip date to avoid logging spam when scheduler runs every minute
  if (typeof runScheduler._lastWeekendSkipDate === 'undefined') runScheduler._lastWeekendSkipDate = null
  const loans = readJSON(loansPath);
  const today = now.toISOString().split("T")[0];
  // Normalize today's string (YYYY-MM-DD)
  const todayStr = today;

  // Helper to get YYYY-MM-DD from loan.dueDate (robust)
  function dueDateStr(d) {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().split("T")[0];
  }

  // Helper to determine if a loan is already returned.
  // Treat as returned if `returnDate` is present OR `status` indicates returned (e.g. 'dikembalikan').
  function isReturned(l) {
    if (!l) return false;
    if (l.returnDate) return true;
    if (l.status) {
      try {
        const s = String(l.status).trim().toLowerCase();
        if (s === 'dikembalikan') return true;
      } catch (e) {
        // ignore and continue
      }
    }
    return false;
  }

  // Overdue: dueDate before today and not yet returned
  const overdue = loans.filter(l => {
    if (isReturned(l)) return false; // already returned
    const ds = dueDateStr(l.dueDate);
    if (!ds) return false;
    return ds < todayStr;
  });

  // Due today (needs return today) and not yet returned
  const dueToday = loans.filter(l => {
    if (isReturned(l)) return false; // already returned
    const ds = dueDateStr(l.dueDate);
    if (!ds) return false;
    return ds === todayStr;
  });

  // Read existing notifications
  const notifications = readJSON(notificationsPath);

  // Scheduled triggers: overdue at 07:00 and 15:00, dueToday at 11:00
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Only send notifications on weekdays (Mon-Fri). Skip on Saturday(6) and Sunday(0).
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) {
    // Avoid spamming the console every minute on weekends; only log once per weekend day
    if (runScheduler._lastWeekendSkipDate !== today) {
      console.log('Today is weekend, skipping scheduled notifications.');
      runScheduler._lastWeekendSkipDate = today;
    }
    return;
  }

  // Helper to check if a slot notification already exists today
  function slotExists(type, slotId) {
    return notifications.some(n => n.type === type && n.slot === slotId && n.timestamp && n.timestamp.split('T')[0] === todayStr);
  }

  // Overdue triggers
  if ((hour === 7 || hour === 15) && minute === 0) {
    const slotId = `overdue-${String(hour).padStart(2, '0')}`;
    if (!slotExists('overdue', slotId)) {
      if (overdue.length > 0) {
        const message = `Ada ${overdue.length} peminjaman yang sudah terlambat dikembalikan!`;
        addNotification(message, 'overdue', slotId);
        console.log('Scheduled overdue notification added for', slotId, message);
      } else {
        console.log('Scheduled overdue check at', slotId, 'found no overdue loans.');
      }
    } else {
      console.log('Overdue notification for', slotId, 'already exists today, skipping.');
    }
  }

  // Due-today trigger at 11:00
  if (hour === 11 && minute === 0) {
    const slotId = 'return-11';
    if (!slotExists('return', slotId)) {
      if (dueToday.length > 0) {
        const message = `Ada ${dueToday.length} peminjaman yang jatuh tempo hari ini`;
        addNotification(message, 'return', slotId);
        console.log('Scheduled return-today notification added for', slotId, message);
      } else {
        console.log('Scheduled return check at 11:00 found no loans due today.');
      }
    } else {
      console.log('Return-today notification for 11:00 already exists today, skipping.');
    }
  }
}

// Single-run invocation
runScheduler();

// Repeating mode: default to 1 hour if SCHEDULER_INTERVAL_MS not provided or <= 0
let intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS || "0", 10);
if (!intervalMs || intervalMs <= 0) intervalMs = 60 * 60 * 1000; // 1 hour default
let intervalId = null;
// Align the repeating timer to the top of the next hour so checks that depend on minute===0 behave reliably
const _now = new Date();
const nextHour = new Date(_now);
nextHour.setHours(_now.getHours() + 1, 0, 0, 0);
const msUntilNextHour = nextHour.getTime() - _now.getTime();
console.log(`Starting scheduler loop, interval ${intervalMs}ms; first repeat in ${msUntilNextHour}ms`);
setTimeout(() => {
  intervalId = setInterval(() => {
    try {
      runScheduler();
    } catch (e) {
      console.error('Scheduler iteration failed', e);
    }
  }, intervalMs);
}, Math.max(0, msUntilNextHour));

// Graceful shutdown
function shutdown() {
  console.log('Shutting down scheduler...');
  if (intervalId) clearInterval(intervalId);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
