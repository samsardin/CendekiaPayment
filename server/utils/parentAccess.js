const { get } = require('../database/db');

const isParent = (user) => user?.role === 'ortu';

const parentOwnsStudent = async (user, studentId) => {
  if (!isParent(user)) return true;

  const child = await get(
    `SELECT s.id
     FROM students s
     JOIN parents p ON s.parent_id = p.id
     WHERE s.id = ? AND p.user_id = ?`,
    [studentId, user.id]
  );

  return Boolean(child);
};

const parentOwnsInvoice = async (user, invoiceId) => {
  if (!isParent(user)) return true;

  const invoice = await get(
    `SELECT i.id
     FROM invoices i
     JOIN students s ON i.student_id = s.id
     JOIN parents p ON s.parent_id = p.id
     WHERE i.id = ? AND p.user_id = ?`,
    [invoiceId, user.id]
  );

  return Boolean(invoice);
};

module.exports = { isParent, parentOwnsStudent, parentOwnsInvoice };
