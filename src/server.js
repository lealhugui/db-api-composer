const models = require('./models');
const http = require('http');

function createLocalServer(app, sync = false) {
    const debug = console.log;
    const port = normalizePort(process.env.SERV_PORT || '4201');
    app.set('port', port);
    const server = http.createServer(app);

    const serverListen = (server) => {
        /**
         * Listen on provided port, on all network interfaces.
         */
        server.listen(port, function () {
            debug('Express server listening on port ' + server.address().port);
        });
        server.on('error', onError);
        server.on('listening', onListening);
    };

    if (sync) {
        models.sequelize.sync({force: true}).then(function () {
            serverListen(server);
        });
    }
    else {
        serverListen(server);
    }


    function normalizePort(val) {
        const port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
        const addr = server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    }
}

if (process.env.WEB_DEBUG == 1) {
    createLocalServer(require('./app'), process.env.SYNC == 1);
} else {
    module.exports = createLocalServer;
}
