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

function addNotification(message, type) {
  const notifications = readJSON(notificationsPath);
  notifications.unshift({
    id: Date.now(),
    message,
    type,
    read: false,
    timestamp: new Date().toISOString(),
  });
  writeJSON(notificationsPath, notifications);
}

function runScheduler() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const loans = readJSON(loansPath);
  const today = now.toISOString().split("T")[0];

  // Overdue reminders: 7:00, 11:00, 15:00
if ([7, 11, 15].includes(hour) && minute === 0) {
    const overdue = loans.filter(l => l.status === "borrowed" && l.dueDate < today);
    if (overdue.length > 0) {
        addNotification(
            `Ada ${overdue.length} peminjaman yang sudah terlambat dikembalikan!`,
            "overdue"
        );
    }
}

// Return reminders: 15:30
if (hour === 15 && minute === 30) {
    const dueSoon = loans.filter(l => l.status === "borrowed" && l.dueDate === today);
    if (dueSoon.length > 0) {
        addNotification(
            `Ada ${dueSoon.length} peminjaman yang jatuh tempo hari ini`,
            "return"
        );
    }
}
}

runScheduler();
