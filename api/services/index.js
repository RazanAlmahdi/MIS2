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
                    'SELECT s.*, d.department_name FROM services s LEFT JOIN departments d ON s.department_id=d.id WHERE s.id=$1',
                    [req.query.id]
                );
                context.res = { status: 200, body: rows[0] || {} };
            } else {
                const { rows } = await pool.query(
                    'SELECT s.*, d.department_name FROM services s LEFT JOIN departments d ON s.department_id=d.id'
                );
                context.res = { status: 200, body: rows };
            }
        } else if (method === "POST") {
            const { service_name, description, department_id, cost } = req.body;
            if (!service_name || !description) {
                context.res = { status: 400, body: "Missing required fields" };
                return;
            }
            const { rows } = await pool.query(
                'INSERT INTO services (id, service_name, description, department_id, cost) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
                [service_name, description, department_id || null, cost || 0]
            );
            context.res = { status: 201, body: rows[0] };
        } else if (method === "PUT") {
            const { id, service_name, description, department_id, cost } = req.body;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            const { rows } = await pool.query(
                'UPDATE services SET service_name=$2, description=$3, department_id=$4, cost=$5 WHERE id=$1 RETURNING *',
                [id, service_name, description, department_id, cost]
            );
            context.res = { status: 200, body: rows[0] };
        } else if (method === "DELETE") {
            const { id } = req.query;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            await pool.query('DELETE FROM services WHERE id=$1', [id]);
            context.res = { status: 200, body: `Service ${id} deleted` };
        } else {
            context.res = { status: 405, body: "Method Not Allowed" };
        }
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: "Server error" };
    }
};
