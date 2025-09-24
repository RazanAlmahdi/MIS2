// api/assignments/list.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

module.exports = async function (context, req) {
  const engId = req.query.engineer_id;
  if (!engId) {
    context.res = { status: 400, body: "Missing engineer_id" };
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT a.request_id, a.status, r.project_name, r.deadline, r.priority, s.service_name
       FROM assigned_users a
       JOIN requests r ON a.request_id = r.id
       JOIN services s ON r.service_id = s.id
       WHERE a.assigned_to_user_id = $1
       ORDER BY r.deadline ASC`,
      [engId]
    );

    context.res = { status: 200, body: rows };
  } catch (err) {
    context.res = { status: 500, body: err.message };
  }
};
