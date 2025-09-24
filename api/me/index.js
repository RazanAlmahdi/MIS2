// // api/me/index.js
// const { Pool } = require("pg");
// const jwt = require("jsonwebtoken"); // validate Entra ID token

// const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

// module.exports = async function (context, req) {
//   try {
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) {
//       context.res = { status: 401, body: "Missing auth token" };
//       return;
//     }

//     const token = authHeader.split(" ")[1];
//     // Normally you'd validate against Microsoft public keys, for now just decode:
//     const decoded = jwt.decode(token);

//     const email = decoded.preferred_username || decoded.upn;

//     const { rows } = await pool.query(
//       `SELECT u.id, u.full_name, u.email, r.role_name, d.department_name
//        FROM users u
//        LEFT JOIN roles r ON u.role_id = r.id
//        LEFT JOIN departments d ON u.department_id = d.id
//        WHERE u.email = $1`,
//       [email]
//     );

//     if (!rows.length) {
//       context.res = { status: 404, body: "User not found" };
//       return;
//     }

//     context.res = { status: 200, body: rows[0] };
//   } catch (err) {
//     context.res = { status: 500, body: err.message };
//   }
// };
// api/me/index.js
const { Pool } = require("pg");
const { authenticate } = require("../../shared/auth");

const pool = new Pool({ connectionString: process.env.AZURE_POSTGRES_CONNECTION_STRING });

module.exports = async function (context, req) {
  try {
    // 1. Validate token
    const decoded = await authenticate(req);
    const email = decoded.preferred_username || decoded.email;
    if (!email) {
      context.res = { status: 400, body: "Token missing email claim" };
      return;
    }

    // 2. Query DB
    const q = `
      SELECT u.id, u.full_name, u.email, r.role_name AS role, u.department_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [email]);

    if (!rows.length) {
      context.res = { status: 404, body: "User not found" };
      return;
    }

    // 3. Respond
    context.res = { status: 200, body: rows[0] };

  } catch (err) {
    console.error("Error in /api/me:", err);
    context.res = { status: err.status || 500, body: err.message || "Server error" };
  }
};
