const pool = require('../../config/db');
const { verifyToken } = require('../../config/authHelper');

module.exports = async function (context, req) {
    try {
        // Validate token
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token || !(await verifyToken(token))) {
            context.res = { status: 401, body: "Unauthorized" };
            return;
        }

        const method = req.method;

        if (method === "GET") {
            if (req.query.id) {
                // Get single department
                const { rows } = await pool.query(
                    'SELECT * FROM departments WHERE id = $1',
                    [req.query.id]
                );
                context.res = { status: 200, body: rows[0] || {} };
            } else {
                // Get all departments
                const { rows } = await pool.query('SELECT * FROM departments');
                context.res = { status: 200, body: rows };
            }
        } 
        else if (method === "POST") {
            const { department_name } = req.body;
            if (!department_name) {
                context.res = { status: 400, body: "Missing department_name" };
                return;
            }
            const { rows } = await pool.query(
                'INSERT INTO departments (id, department_name) VALUES (gen_random_uuid(), $1) RETURNING *',
                [department_name]
            );
            context.res = { status: 201, body: rows[0] };
        } 
        else if (method === "PUT") {
            const { id, department_name } = req.body;
            if (!id || !department_name) {
                context.res = { status: 400, body: "Missing id or department_name" };
                return;
            }
            const { rows } = await pool.query(
                'UPDATE departments SET department_name = $2 WHERE id = $1 RETURNING *',
                [id, department_name]
            );
            context.res = { status: 200, body: rows[0] };
        } 
        else if (method === "DELETE") {
            const { id } = req.query;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            await pool.query('DELETE FROM departments WHERE id = $1', [id]);
            context.res = { status: 200, body: `Department ${id} deleted` };
        } 
        else {
            context.res = { status: 405, body: "Method Not Allowed" };
        }
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: "Server error" };
    }
};
