import nodemailer from "nodemailer";

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
 * Configure smtp
 */
const MAIL_HOST = process.env.MAIL_HOST || 'smtp'
const MAIL_PORT = process.env.MAIL_PORT || 25
const MAIL_USERNAME = process.env.MAIL_USERNAME || 'noreply'
const MAIL_PASSWORD = process.env.MAIL_PASSWORD || 'password'
const MAIL_ENCRYPTION = process.env.MAIL_ENCRYPTION || null
const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || 'noreply'
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'TestMail'

/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'consumer.send.email';

/**
 * Modules
 */
import amqp from 'amqplib/callback_api.js';

// Pause
let date = Date.now();
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
         * Assert channel to queues
         */
        await channel.assertQueue(RABBITMQ_QUEUE_SEND_EMAIL, {}, (errorEmailQueue) => {
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
        channel.consume(RABBITMQ_QUEUE_SEND_EMAIL, async (data) => {

            // let date = Date.now();
            // while (Date.now() - date < 30000) {}

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
             * Try send email
             */
            try {
                /**
                 * Configure SMTP server
                 */
                const transporter = nodemailer.createTransport({
                    host: MAIL_HOST,
                    port: MAIL_PORT,
                    secure: true,
                    auth: {
                        user: MAIL_USERNAME,
                        pass: MAIL_PASSWORD,
                    },
                });

                /**
                 * Configure email
                 */
                const mailOptions = {
                    from: MAIL_FROM_ADDRESS,
                    to: msgIn.body.email,
                    subject: 'Hello, ' + msgIn.body.name,
                    text: 'U message:\n' + msgIn.body.message + '\n\n Event Id: ' + msgIn.eventId,
                    html: '<p>U message: ' + msgIn.body.message + '</p> <footer>Event Id: ' + msgIn.eventId + '</footer>',
                };

                const info = await transporter.sendMail(mailOptions);
                msgOut.status = 'success';
                msgOut.body.messageId = info.messageId;
            } catch (error) {
                msgOut.status = 'failed';
                msgOut.errors = [error];
            }

            /**
             * Remove message from email queue
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
