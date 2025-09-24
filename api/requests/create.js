// api/requests/create.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

module.exports = async function (context, req) {
  const { projectName, specifications, deadline, priority, serviceId, requestedBy } = req.body;

  if (!projectName || !deadline || !priority || !serviceId || !requestedBy) {
    context.res = { status: 400, body: "Missing required fields" };
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO requests (project_name, specifications, deadline, priority, service_id, requested_by_user_id, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [projectName, specifications, deadline, priority, serviceId, requestedBy]
    );

    context.res = {
      status: 201,
      body: { success: true, requestId: result.rows[0].id }
    };
  } catch (err) {
    context.res = { status: 500, body: err.message };
  }
};
