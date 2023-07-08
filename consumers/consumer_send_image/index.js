
/**
 * Configure RabbitMQ server
 */
const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user';
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password';
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;
const RABBITMQ_CONNECTION_URI = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`;

const RABBITMQ_QUEUE_SEND_IMAGE = process.env.RABBITMQ_QUEUE_SEND_IMAGE || 'send.image';
const RABBITMQ_QUEUE_SEND_FRONT = process.env.RABBITMQ_QUEUE_SEND_FRONT || 'send.front';


/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'consumer.send.image';

/**
 * Modules
 */
import amqp from 'amqplib/callback_api.js';

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
         * Assert channel to queues
         */
        await channel.assertQueue(RABBITMQ_QUEUE_SEND_IMAGE, {}, (errorEmailQueue) => {
            if (errorEmailQueue) {
                console.error(errorEmailQueue);
                process.exit(-1);
            }
            console.debug("Email queue asserted");
        });
        await channel.assertQueue(RABBITMQ_QUEUE_SEND_FRONT, {}, (errorFrontQueue) => {
            if (errorFrontQueue) {
                console.error(errorFrontQueue);
                process.exit(-1);
            }
            console.debug("Front queue asserted");
        });

        /**
         * Step 4
         * Consumer
         */
        channel.consume(RABBITMQ_QUEUE_SEND_IMAGE, async (data) => {
            /**
             * Restore message from producer
             * api.send.email -->
             */
            const msgIn = JSON.parse(data.content.toString());
            console.debug('Catch message:')
            console.debug(msgIn);

            /**
             * Output message
             */
            const msgOut = {
                'eventId' : msgIn.eventId,
                'server': SERVER_NAME,
                'eventType': 'send.mail',
                'errors': null,
                'body': {}
            };


            /**
             * Remove message from  queue
             */
            channel.ack(data);
            /**
             * Send message to front consumer
             * --> consumer.send.front
             */
            console.debug('Send message:');
            console.debug(msgOut);
            channel.sendToQueue(RABBITMQ_QUEUE_SEND_FRONT, Buffer.from(JSON.stringify(msgOut)));
        });
    });
});
