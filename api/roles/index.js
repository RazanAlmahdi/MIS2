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
            if (req.query.id) {
                const { rows } = await pool.query(
                    'SELECT r.*, d.department_name FROM roles r LEFT JOIN departments d ON r.department_id=d.id WHERE r.id=$1',
                    [req.query.id]
                );
                context.res = { status: 200, body: rows[0] || {} };
            } else {
                const { rows } = await pool.query(
                    'SELECT r.*, d.department_name FROM roles r LEFT JOIN departments d ON r.department_id=d.id'
                );
                context.res = { status: 200, body: rows };
            }
        } else if (method === "POST") {
            const { role_name, department_id } = req.body;
            if (!role_name || !department_id) {
                context.res = { status: 400, body: "Missing role_name or department_id" };
                return;
            }
            const { rows } = await pool.query(
                'INSERT INTO roles (id, role_name, department_id) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
                [role_name, department_id]
            );
            context.res = { status: 201, body: rows[0] };
        } else if (method === "PUT") {
            const { id, role_name, department_id } = req.body;
            if (!id || !role_name || !department_id) {
                context.res = { status: 400, body: "Missing id, role_name or department_id" };
                return;
            }
            const { rows } = await pool.query(
                'UPDATE roles SET role_name=$2, department_id=$3 WHERE id=$1 RETURNING *',
                [id, role_name, department_id]
            );
            context.res = { status: 200, body: rows[0] };
        } else if (method === "DELETE") {
            const { id } = req.query;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            await pool.query('DELETE FROM roles WHERE id=$1', [id]);
            context.res = { status: 200, body: `Role ${id} deleted` };
        } else {
            context.res = { status: 405, body: "Method Not Allowed" };
        }
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: "Server error" };
    }
};
