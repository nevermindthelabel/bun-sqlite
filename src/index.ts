import { Hono } from 'hono';

import { serveStatic } from 'hono/bun';

import { Database } from 'bun:sqlite';

const sqlite = new Database('users.db');

sqlite.run(`
		CREATE TABLE IF NOT EXISTS users (
			user_id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			email TEXT
		);
`);

sqlite.run(`
		CREATE TABLE IF NOT EXISTS access_tokens (
				access_token_id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				token TEXT NOT NULL,
				expiration DATETIME NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(user_id)
		);
`);

sqlite.run(`
		CREATE TABLE IF NOT EXISTS refresh_tokens (
				refresh_token_id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				token TEXT NOT NULL,
				expiration DATETIME NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(user_id)
		);
`);

const app = new Hono();

app.get('/', c => {
	return c.html(/*html*/ `
	<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Register</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						display: flex;
						justify-content: center;
						align-items: center;
						height: 100vh;
						margin: 0;
						background-color: #000;
					}
				</style>
			</head>
			<body>
				<form id="register" method="POST">
					<input type="email" name="email" /><input
						type="password"
						name="password"
					/>
					<button>Submit</button>
				</form>
			</body>
			<script>
				document.getElementById('register').addEventListener('submit', async e => {
					e.preventDefault();
					const formData = new FormData(e.target);
					const response = await fetch('/register', {
						method: 'POST',
						body: formData,
					});
					const data = await response.json();
					console.log(data);
				});
			</script>
		</html>
	`);
});

app.post('/register', async c => {
	// console.log(c.body);
	// console.log(c.req.parseBody());
	const body = await c.req.parseBody();
	console.log(body);
	const { email, password } = body;
	if (typeof email !== 'string' || typeof password !== 'string')
		return c.json({ error: 'Invalid input' });
	const normalizedEmail = email.toLowerCase();
	// const { email, password } = await c.body();
	// console.log(email, password);
	const user = sqlite.query('SELECT * FROM users WHERE email = ?');
	user.all(normalizedEmail);
	console.log(user.get(normalizedEmail));
	// const user = await sqlite.get(`SELECT * FROM users WHERE email = ?`, email);

	// if (user) {
	// 	return c.json({ error: 'User already exists' });
	// }

	// const passwordHash = await c.hash(password);

	const stmt = await sqlite.query(
		'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)'
		// email,
		// passwordHash
	);

	stmt.all(email, password, email.split('@')[0]);

	return c.json({ success: 'User created' });
});

export default app;
