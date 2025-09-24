// api/tasks/update.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

module.exports = async function (context, req) {
  const requestId = context.bindingData.id; // /api/tasks/{id}
  const { engineerId, status } = req.body;

  if (!engineerId || !["in_progress", "completed"].includes(status)) {
    context.res = { status: 400, body: "Invalid input" };
    return;
  }

  try {
    await pool.query(
      `UPDATE assigned_users SET status = $1
       WHERE request_id = $2 AND assigned_to_user_id = $3`,
      [status, requestId, engineerId]
    );
    context.res = { status: 200, body: { success: true } };
  } catch (err) {
    context.res = { status: 500, body: err.message };
  }
};
