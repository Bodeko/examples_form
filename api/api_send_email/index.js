/**
 * Configure RabbitMQ server
 */
const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user';
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password';
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;
const RABBITMQ_CONNECTION_URI = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`;

const RABBITMQ_QUEUE_SEND_EMAIL = process.env.RABBITMQ_QUEUE_SEND_EMAIL || 'send.email';

/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'api.send.email';
const SERVER_PORT = process.env.SERVER_PORT || 3000;

/**
 * Modules
 */
import amqp from 'amqplib/callback_api.js';
import http from 'http';
import { v4 } from 'uuid';

// Pause
const date = Date.now();
while (Date.now() - date < 5000) {}

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
        await channel.assertQueue(RABBITMQ_QUEUE_SEND_EMAIL, {}, (errorEmailQueue) => {
            if (errorEmailQueue) {
                console.error(errorEmailQueue);
                process.exit(-1);
            }
            console.debug("Email queue asserted");
        });

        /**
         * Step 4
         * Create HTTP server
         */
        http.createServer((request, response) => {
            /**
             * Step 5
             * When front sends data, create msg with UUID v4
             */
            let msg = {
                'eventId': v4(),
                'server': SERVER_NAME,
                'eventType': 'send.mail',
                'status': 'success',
                'errors': null,
                'body': {
                    'email': 'keeper@ninydev.com', //request.body.email,
                    'name': 'Oleksandr Nykytin', //request.body.name
                    'message': 'hello email'
                }
            };
            console.debug('Send message:');
            console.debug(msg);

            /**
             * Step 6
             * Send message to RabbitMQ queue
             * --> consumer.send.email
             */
            channel.sendToQueue(RABBITMQ_QUEUE_SEND_EMAIL, Buffer.from(JSON.stringify(msg)));

            /**
             * Step 7
             * Send msg.id to front
             */
            response.end(msg.eventId);
        }).listen(3000);
    });
});
