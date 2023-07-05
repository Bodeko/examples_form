/**
 * Configure RabbitMQ server
 */
const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user';
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password';
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;
const RABBITMQ_CONNECTION_URI = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`;

const RABBITMQ_QUEUE_SEND_EMAIL = process.env.RABBITMQ_QUEUE_SEND_EMAIL || 'send.email';
const RABBITMQ_QUEUE_SEND_FRONT = process.env.RABBITMQ_QUEUE_SEND_FRONT || 'send.front';

/**
 * Configure Redis server
 */
const REDIS_SOCKET_HOST = process.env.REDIS_SOCKET_HOST || 'redis.sockets';
const REDIS_SOCKET_PORT = process.env.REDIS_SOCKET_PORT || 6379;
const REDIS_SOCKET_CONNECTION_STRING = `redis://${REDIS_SOCKET_HOST}:${REDIS_SOCKET_PORT}`;

/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'consumer.send.front';

/**
 * Modules
 */
import amqp from 'amqplib/callback_api.js';
import { Emitter } from "@socket.io/redis-emitter";
import { createClient } from "redis";

// Pause
const date = Date.now();
while (Date.now() - date < 10000) {}

/**
 * Step 1
 * Connect to RabbitMQ server
 */
amqp.connect(RABBITMQ_CONNECTION_URI, {}, async (errorConnect, connection) => {
    if (errorConnect) {
        console.error(errorConnect);
        process.exit(-1);
    }
    console.debug("connect RabbitMQ ok");

    /**
     * Step 2
     * Create RabbitMQ channel
     */
    await connection.createChannel(async (errorChannel, channel) => {
        if (errorChannel) {
            console.error(errorChannel);
            process.exit(-1);
        }

        /**
         * Step 3
         * Assert channel to queue
         */
        await channel.assertQueue(RABBITMQ_QUEUE_SEND_FRONT, {}, (errorFrontQueue) => {
            if (errorFrontQueue) {
                console.error(errorFrontQueue);
                process.exit(-1);
            }
            console.debug("Front queue asserted");
        });

        /**
         * Step 4
         * Create redis emitter
         */
        const redisClient = createClient({ url: REDIS_SOCKET_CONNECTION_STRING });

        redisClient.connect().then(() => {
            console.debug('Connect redis ok');
            const emitter = new Emitter(redisClient);

            // For test
            setInterval(() =>{
                emitter.emit('ping', Date.now().toLocaleString())
            }, 10000)



            /**
             * Step 5
             * Consumer
             */
            channel.consume(RABBITMQ_QUEUE_SEND_FRONT, async (data) => {
                /**
                 * Restore message from producer
                 */
                const msgIn = JSON.parse(data.content.toString());
                console.debug('Catch message:');
                console.debug(msgIn);

                const eventName = msgIn.eventType + '.' + msgIn.eventId;
                console.debug(eventName);

                emitter.emit(eventName, msgIn)

                /**
                 * Remove message from queue
                 */
                channel.ack(data);
            });
        });

    });
});
