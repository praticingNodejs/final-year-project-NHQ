/* eslint-disable no-console */
import logger from './logger'
import app from './app'

const port = process.env.PORT || app.get('port')
const server = app.listen(port)

process.on('unhandledRejection', (reason, _p) =>
    logger.error('Unhandled Rejection at: Promise ', reason)
)

server.on('listening', () =>
    logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
)
