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
            const { rows } = await pool.query(
                `SELECT au.*, u1.full_name AS assigned_to, u2.full_name AS assigned_by, r.project_name
                 FROM assigned_users au
                 LEFT JOIN users u1 ON au.assigned_to_user_id=u1.id
                 LEFT JOIN users u2 ON au.assigned_by_team_leader_id=u2.id
                 LEFT JOIN requests r ON au.request_id=r.id`
            );
            context.res = { status: 200, body: rows };
        } else if (method === "POST") {
            const { request_id, assigned_to_user_id, assigned_by_team_leader_id } = req.body;
            if (!request_id || !assigned_to_user_id || !assigned_by_team_leader_id) {
                context.res = { status: 400, body: "Missing required fields" };
                return;
            }
            const { rows } = await pool.query(
                'INSERT INTO assigned_users (request_id, assigned_to_user_id, assigned_by_team_leader_id) VALUES ($1,$2,$3) RETURNING *',
                [request_id, assigned_to_user_id, assigned_by_team_leader_id]
            );
            context.res = { status: 201, body: rows[0] };
        } else if (method === "PUT") {
            const { request_id, assigned_to_user_id, status } = req.body;
            if (!request_id || !assigned_to_user_id || !status) {
                context.res = { status: 400, body: "Missing required fields" };
                return;
            }
            const { rows } = await pool.query(
                'UPDATE assigned_users SET status=$3 WHERE request_id=$1 AND assigned_to_user_id=$2 RETURNING *',
                [request_id, assigned_to_user_id, status]
            );
            context.res = { status: 200, body: rows[0] };
        } else if (method === "DELETE") {
            const { request_id, assigned_to_user_id } = req.query;
            if (!request_id || !assigned_to_user_id) {
                context.res = { status: 400, body: "Missing request_id or assigned_to_user_id" };
                return;
            }
            await pool.query(
                'DELETE FROM assigned_users WHERE request_id=$1 AND assigned_to_user_id=$2',
                [request_id, assigned_to_user_id]
            );
            context.res = { status: 200, body: `Assignment deleted` };
        } else {
            context.res = { status: 405, body: "Method Not Allowed" };
        }
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: "Server error" };
    }
};
