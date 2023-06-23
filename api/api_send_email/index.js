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

import amqp from 'amqplib'
import http from 'http'

let connection
let channel

(async () => {
    try {
        connection = await amqp.connect(RABBITMQ_CONNECTION_URI)
        console.debug(`${SERVER_NAME}: connection to ${RABBITMQ_CONNECTION_URI}`)
        channel = await connection.createChannel()
        await channel.assertQueue(RABBITMQ_QUEUE_SEND_EMAIL)
        console.debug(`${SERVER_NAME}: channel to RabbitMQ server ok`)

        http.createServer((request, response) =>{
            let msg = {
                userName: 'Nykytin',
                userEmail: 'keeper@ninydev.com'
            }
            channel.sendToQueue(RABBITMQ_QUEUE_SEND_EMAIL, Buffer.from('test'))
            //channel.sendToQueue(RABBITMQ_QUEUE_SEND_EMAIL, Buffer.from(JSON.stringify(msg)))
            response.end()
            }).listen(SERVER_PORT, () => {
                console.debug(`${SERVER_NAME}: http server start`)
        })
    }
    catch (err) {
        console.error(err)
    }
    finally {
        if (connection) await connection.close()
    }
})()


// amqp.connect(`amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`,
//     (errorConnect, connection) => {
//         if (errorConnect) {
//             console.error(errorConnect)
//             process.exit(-1);
//         }
//         console.debug("connect RabbitMQ ok")
//
//         connection.createChannel((errorChannel, channel) => {
//             if (errorChannel) {
//                 console.log(errorChannel)
//                 process.exit(-1);
//             }
//             console.debug("create RabbitMQ channel ok")
//
//             channel.assertQueue(RABBITMQ_QUEUE_SEND_EMAIL);
//
//             http.createServer((request, response) =>{
//                 console.debug(request)
//                 response.end()
//             }).listen(3000);
//         })
//     })
//     .catch(exception => {
//         console.error(exception)
//     })
//
