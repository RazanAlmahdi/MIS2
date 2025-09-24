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
                    `SELECT req.*, u.full_name AS requested_by, s.service_name, d.department_name
                     FROM requests req
                     LEFT JOIN users u ON req.requested_by_user_id=u.id
                     LEFT JOIN services s ON req.service_id=s.id
                     LEFT JOIN departments d ON req.department_id=d.id
                     WHERE req.id=$1`,
                    [req.query.id]
                );
                context.res = { status: 200, body: rows[0] || {} };
            } else {
                const { rows } = await pool.query(
                    `SELECT req.*, u.full_name AS requested_by, s.service_name, d.department_name
                     FROM requests req
                     LEFT JOIN users u ON req.requested_by_user_id=u.id
                     LEFT JOIN services s ON req.service_id=s.id
                     LEFT JOIN departments d ON req.department_id=d.id`
                );
                context.res = { status: 200, body: rows };
            }
        } else if (method === "POST") {
            const { project_name, specifications, deadline, priority, budget, requested_by_user_id, service_id, department_id } = req.body;
            if (!project_name || !deadline || !requested_by_user_id || !service_id) {
                context.res = { status: 400, body: "Missing required fields" };
                return;
            }
            const { rows } = await pool.query(
                `INSERT INTO requests (id, project_name, specifications, deadline, priority, budget, requested_by_user_id, service_id, department_id)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [project_name, specifications || '', deadline, priority || null, budget || null, requested_by_user_id, service_id, department_id || null]
            );
            context.res = { status: 201, body: rows[0] };
        } else if (method === "PUT") {
            const { id, project_name, specifications, deadline, priority, budget, status } = req.body;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            const { rows } = await pool.query(
                `UPDATE requests
                 SET project_name=$2, specifications=$3, deadline=$4, priority=$5, budget=$6, status=$7
                 WHERE id=$1 RETURNING *`,
                [id, project_name, specifications, deadline, priority, budget, status]
            );
            context.res = { status: 200, body: rows[0] };
        } else if (method === "DELETE") {
            const { id } = req.query;
            if (!id) {
                context.res = { status: 400, body: "Missing id" };
                return;
            }
            await pool.query('DELETE FROM requests WHERE id=$1', [id]);
            context.res = { status: 200, body: `Request ${id} deleted` };
        } else {
            context.res = { status: 405, body: "Method Not Allowed" };
        }
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: "Server error" };
    }
};
