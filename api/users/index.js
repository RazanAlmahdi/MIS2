const pool = require('../../config/db');
const { verifyToken } = require('../../config/authHelper');

module.exports = async function (context, req) {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token || !(await verifyToken(token))) {
            context.res = { status: 401, body: "Unauthorized" };
            return;
        }

        const method = req.method;

        if (method === "GET") {
            if (req.query.me) {
                // Return current user based on token or azure_ad_object_id
                const userId = req.query.me; // could map token -> azure_ad_object_id
                const { rows } = await pool.query(
                    'SELECT u.*, r.role_name, d.department_name FROM users u LEFT JOIN roles r ON u.role_id=r.id LEFT JOIN departments d ON u.department_id=d.id WHERE u.azure_ad_object_id=$1',
                    [userId]
                );
                context.res = { status: 200, body: rows[0] || {} };
            } else if (req.query.id) {
                const { rows } = await pool.query(
                    'SELECT u.*, r.role_name, d.department_name FROM users u LEFT JOIN roles r ON u.role_id=r.id LEFT JOIN departments d ON u.department_id=d.id WHERE u.id=$1',
                    [req.query.id]
                );
                context.res = { status: 200, body: rows[0] || {} };
            } else {
                const { rows } = await pool.query(
                    'SELECT u.*, r.role_name, d.department_name FROM users u LEFT JOIN roles r ON u.role_id=r.id LEFT JOIN departments d ON u.department_id=d.id'
                );
                context.res = { status: 200, body: rows };
            }
        } else if (method === "POST") {
            const { azure_ad_object_id, full_name, email, role_id, department_id } = req.body;
            if (!azure_ad_object_id || !full_name || !email) {
                context.res = { status: 400, body: "Missing required fields" };
                return;
            }
            const { rows } = await pool.query(
                'INSERT INTO users (id, azure_ad_object_id, full_name, email, role_id, department_id) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING *',
                [azure_ad_object_id, full_name, email, role_id || null, department_id || null]
            );
            context.res = { status: 201, body: rows[0] };
        } else if (method === "PUT") {
            const { id, full_name, email, role_id, department_id } = req.body;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            const { rows } = await pool.query(
                'UPDATE users SET full_name=$2, email=$3, role_id=$4, department_id=$5 WHERE id=$1 RETURNING *',
                [id, full_name, email, role_id, department_id]
            );
            context.res = { status: 200, body: rows[0] };
        } else if (method === "DELETE") {
            const { id } = req.query;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            await pool.query('DELETE FROM users WHERE id=$1', [id]);
            context.res = { status: 200, body: `User ${id} deleted` };
        } else {
            context.res = { status: 405, body: "Method Not Allowed" };
        }
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: "Server error" };
    }
};
