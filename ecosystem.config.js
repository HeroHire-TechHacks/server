// this file is called by npm start or npm run dev.

module.exports = {
	apps: [
		{
			name: 'server-herohire-prod',
			script: 'node',
			args: 'index.js',
			env: {
				NODE_ENV: 'production',
			},
			watch: true,
			ignore_watch: ['node_modules', 'src/logs'],
		},
		{
			name: 'server-herohire-dev',
			script: 'node',
			args: 'index.js',
			env: {
				NODE_ENV: 'development',
			},
			watch: true,
			ignore_watch: ['node_modules', 'src/logs'],
		},
	],
};
