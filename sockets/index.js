/**
 * Configure app
 */
const PORT = process.env.PORT || 3000
const SERVER_NAME = process.env.SERVER_NAME || 'Node Socket'
const REDIS_SOCKET_HOST = process.env.REDIS_SOCKET_HOST || 'redis.sockets'
const REDIS_SOCKET_PORT = process.env.REDIS_SOCKET_PORT || 6379

/**
 * Import modules
 */
import { Server } from 'socket.io'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
/**
 * Configure redis
 */
const pubClient = createClient({
    url: `redis://${REDIS_SOCKET_HOST}:${REDIS_SOCKET_PORT}`})
const subClient = pubClient.duplicate()

pubClient.on('connect', () => {
    console.debug('pubs connected')
})
subClient.on('connect', () => {
    console.debug('subs connected')
})

/**
 * Create socket server
 */
const io = new Server()

/**
 * Start server
 */
Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
        io.adapter(createAdapter(pubClient, subClient))

        io.on('connection', (socket) => {
            socket.emit('socket.myNameIs', SERVER_NAME)
            console.debug('connection: ' + socket.handshake.address)

            socket.on('disconnect', data => {
                console.debug('disconnect: ' + socket.handshake.address)
            })
        })

        /**
         * Start socket server
         */
        io.listen(PORT, (err) => {
            if (err) {
                console.error(err)
                process.exit(-1)
            } else {
                console.debug(`Start Socket Server ${SERVER_NAME}:${PORT}`)
            }
        });
    })
    .catch(err => {
        console.error(err)
    })
