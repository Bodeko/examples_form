/**
 * Configure RabbitMQ server
 */
const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user'
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password'
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq'
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672
const RABBITMQ_CONNECTION_URI = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`

const RABBITMQ_QUEUE_SEND_EMAIL = process.env.RABBITMQ_QUEUE_SEND_EMAIL || 'sendEmail'

/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'api.send.email'
const SERVER_PORT = process.env.SERVER_PORT || 3000

/**
 * Modules
 */
import amqp from 'amqplib/callback_api.js'
import http from 'http'
import { v4 } from 'uuid'

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
        connection.createChannel((errorChannel, channel) => {
            if (errorChannel) {
                console.error(errorChannel)
                process.exit(-1)
            }
            channel.assertQueue(RABBITMQ_QUEUE_SEND_EMAIL)
            console.debug("create RabbitMQ channel ok")

            /**
             * Step 3
             * Create http server
             */
            http.createServer((request, response) =>{
                /**
                 * Step 4
                 * when front send data create msg id <UUID v4>
                 */
                let msg = {
                    'id' : v4(),
                    'email' : 'keeper@ninydev.com', //request.body.email,
                    'name' : 'Oleksandr Nykytin' //request.body.name
                }
                console.log(msg)

                /**
                 * Step 5
                 * send message to RabbitMQ queue
                 */
                channel.sendToQueue(RABBITMQ_QUEUE_SEND_EMAIL, Buffer.from(JSON.stringify(msg)))

                /**
                 * Step 6
                 * send msg.id to front
                 */
                response.end(msg.id)
            }).listen(3000)
        })
    })