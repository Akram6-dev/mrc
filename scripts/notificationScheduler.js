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

  // Overdue: dueDate before today and not yet returned
  const overdue = loans.filter(l => {
    if (l.returnDate) return false; // already returned
    const ds = dueDateStr(l.dueDate);
    if (!ds) return false;
    return ds < todayStr;
  });

  // Due today (needs return today) and not yet returned
  const dueToday = loans.filter(l => {
    if (l.returnDate) return false;
    const ds = dueDateStr(l.dueDate);
    if (!ds) return false;
    return ds === todayStr;
  });

  // Read existing notifications
  const notifications = readJSON(notificationsPath);

  // Scheduled triggers: overdue at 07:00 and 15:00, dueToday at 11:00
  const hour = now.getHours();
  const minute = now.getMinutes();

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

// If SCHEDULER_INTERVAL_MS is set, run repeatedly
const intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS || "0", 10);
let intervalId = null;
if (intervalMs > 0) {
  console.log(`Starting scheduler loop, interval ${intervalMs}ms`);
  intervalId = setInterval(() => {
    try {
      runScheduler();
    } catch (e) {
      console.error('Scheduler iteration failed', e);
    }
  }, intervalMs);
}

// Graceful shutdown
function shutdown() {
  console.log('Shutting down scheduler...');
  if (intervalId) clearInterval(intervalId);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
