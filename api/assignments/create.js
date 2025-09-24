// api/assignments/create.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

module.exports = async function (context, req) {
  const { requestId, engineerIds, teamLeaderId } = req.body;

  if (!requestId || !engineerIds?.length || !teamLeaderId) {
    context.res = { status: 400, body: "Missing required fields" };
    return;
  }

  try {
    for (const engId of engineerIds) {
      await pool.query(
        `INSERT INTO assigned_users (request_id, assigned_to_user_id, assigned_by_team_leader_id, status)
         VALUES ($1, $2, $3, 'assigned')
         ON CONFLICT (request_id, assigned_to_user_id) DO NOTHING`,
        [requestId, engId, teamLeaderId]
      );
    }

    context.res = { status: 201, body: { success: true } };
  } catch (err) {
    context.res = { status: 500, body: err.message };
  }
};
