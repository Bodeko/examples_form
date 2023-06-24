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
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'consumer.send.email';

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
            /**
             * Restore message from producer
             */
            const msgIn = JSON.parse(data.content.toString());
            console.log(msgIn);

            /**
             * Try send email
             */
            try {
                // Создание транспорта для SMTP
                const transporter = nodemailer.createTransport({
                    host: 'smtp.example.com', // Укажите хост SMTP-сервера
                    port: 587, // Укажите порт SMTP-сервера
                    secure: false, // Установите true, если требуется SSL-соединение
                    auth: {
                        user: 'your_username', // Укажите имя пользователя для аутентификации на SMTP-сервере
                        pass: 'your_password', // Укажите пароль для аутентификации на SMTP-сервере
                    },
                });

                // Определение содержимого письма
                const mailOptions = {
                    from: 'your_email@example.com', // Укажите адрес электронной почты отправителя
                    to: userEmail, // Укажите адрес электронной почты получателя
                    subject: 'Привет, ' + userName, // Укажите тему письма
                    text: 'Пример текста письма', // Укажите текст письма
                };

                // Отправка письма
                const info = await transporter.sendMail(mailOptions);
                console.log('Письмо успешно отправлено:', info.messageId);
            } catch (error) {
                console.error('Ошибка при отправке письма:', error);
            }

            /**
             * Remove message from queue
             */
            channel.ack(data);
        });
    });
});
