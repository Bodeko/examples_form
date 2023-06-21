const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user';
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password';
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;


const amqp = require("amqplib/callback_api");


amqp.connect(`amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`,
    function(errorConnect, connection) {
        if (errorConnect) {
            console.error(errorConnect)
            process.exit(-1);
        }
        console.debug("connect RabbitMQ ok")
        amqpConnection = connection
        connection.createChannel(function(errorChannel, channel) {
            if (errorChannel) {
                console.log(errorChannel)
                process.exit(-1);
            }
            console.log("create RabbitMQ channel ok")
            let amqpChannelPingator = channel
            let amqpChannelFront = channel

            amqpChannelPingator.assertQueue(rabbitQueuePingator, {
                // durable: false
            });

            amqpChannelFront.assertQueue(rabbitQueueSendToFront, {
                // durable: false
            });

            // А тут мы слушаем что нужно сделать
            amqpChannelPingator.consume(rabbitQueuePingator, function(msg) {
                // let seconds = 20
                // let waitTill = new Date(new Date().getTime() + seconds * 1000);
                // while(waitTill > new Date()){}

                data = msg.content.toString()
                let d = new Date().toLocaleString()
                console.log("[x] " + d + "  Pingator  %s ", data)

                // нагрузка - что-то он выполнил

                // По окончании отправляем на другую очередь, что все ок - и надо сообщить фронту

                // Упаковка сообщени ядля отправки на фронт
                let msgToFront = {
                    event: 'consumers.pingator',
                    body: data
                }

                amqpChannelFront.sendToQueue(rabbitQueueSendToFront, Buffer.from(JSON.stringify(msgToFront)))
            }, {
                noAck: true
            });


        });
    });
