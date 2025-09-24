// api/requests/update.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

module.exports = async function (context, req) {
  const requestId = context.bindingData.id; // e.g. /api/requests/{id}
  const { approval_status } = req.body;

  if (!["approved", "declined"].includes(approval_status)) {
    context.res = { status: 400, body: "Invalid approval status" };
    return;
  }

  try {
    await pool.query(
      `UPDATE requests SET approval_status = $1 WHERE id = $2`,
      [approval_status, requestId]
    );
    context.res = { status: 200, body: { success: true } };
  } catch (err) {
    context.res = { status: 500, body: err.message };
  }
};
