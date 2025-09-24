// api/requests/list.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

module.exports = async function (context, req) {
  const deptId = req.query.department_id;
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.project_name, r.specifications, r.deadline, r.priority, r.approval_status,
              s.service_name, u.full_name AS requested_by
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN users u ON r.requested_by_user_id = u.id
       WHERE ($1::uuid IS NULL OR r.department_id = $1)
       ORDER BY r.created_at DESC`,
      [deptId || null]
    );
    context.res = { status: 200, body: rows };
  } catch (err) {
    context.res = { status: 500, body: err.message };
  }
};
