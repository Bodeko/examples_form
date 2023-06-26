/**
 * Configure Redis server
 */
const REDIS_SOCKET_HOST = process.env.REDIS_SOCKET_HOST || 'redis.sockets';
const REDIS_SOCKET_PORT = process.env.REDIS_SOCKET_PORT || 6379;
const REDIS_SOCKET_CONNECTION_STRING = `redis://${REDIS_SOCKET_HOST}:${REDIS_SOCKET_PORT}`;

/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'Node Socket';
const SERVER_PORT = process.env.SERVER_PORT || 3030;


/**
 * Import modules
 */
import { createServer } from "http";
import { Server } from 'socket.io';
import socketIOAdmin from "@socket.io/admin-ui";
import { createAdapter } from '@socket.io/redis-adapter';

const redisAdapter = createAdapter({
    host: 'localhost', // Адрес Redis-сервера
    port: 6379, // Порт Redis-сервера
    // Другие параметры адаптера Redis, если необходимо
});

/**
 * Create socket server
 */
const io = new Server();

