/**
 * Configure RabbitMQ server
 */
const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user'
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password'
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq'
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672
const RABBITMQ_CONNECTION_URI = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`

const RABBITMQ_QUEUE_SEND_EMAIL = process.env.RABBITMQ_QUEUE_SEND_EMAIL || 'send.email'
const RABBITMQ_QUEUE_SEND_FRONT = process.env.RABBITMQ_QUEUE_SEND_FRONT || 'send.front'

/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'api.send.email'
const SERVER_PORT = process.env.SERVER_PORT || 3000

/**
 * Modules
 */
import amqp from 'amqplib/callback_api.js'


/**
 * Step 1
 * Connect to rabbitMQ server
 */
amqp.connect(RABBITMQ_CONNECTION_URI,{},
    async (errorConnect, connection) => {
        if (errorConnect) {
            console.error(errorConnect)
            process.exit(-1)
        }
        console.debug("connect RabbitMQ ok")

        /**
         * Step 2
         * Create rabbitMQ channel
         */
        await connection.createChannel((errorChannel, channel) => {
            if (errorChannel) {
                console.error(errorChannel)
                process.exit(-1)
            }
            channel.assertQueue(RABBITMQ_QUEUE_SEND_EMAIL)
            console.debug("Email queue asserted")

        })
    })