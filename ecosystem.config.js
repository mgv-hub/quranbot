module.exports = {
    apps: [
        {
            name: 'QuranBot',
            script: 'src/bot/core.js',
            node_args: '--trace-warnings --trace-deprecation --unhandled-rejections=strict --enable-source-maps',
            autorestart: true,
            watch: false,
            ignore_watch: ['node_modules', 'storage/logs', 'logs', '.git', '.test'],
            instances: 1,
            exec_mode: 'fork',
            env: {
                merge_logs: true,
                log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
                error_file: 'storage/pm2/logs/pm2-error.log',
                out_file: 'storage/pm2/logs/pm2-out.log',
                restart_delay: 7000,
            },
        },
    ],
};
