// настройки соединения с шиной данных
const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user';
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password';
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;

const amqp = require("amqplib/callback_api");

// Настройки соединения с сокетами
const REDIS_SOCKET_HOST = process.env.REDIS_SOCKET_HOST || 'redis.socket';
const REDIS_SOCKET_PORT = process.env.REDIS_SOCKET_PORT || 6379;

const {Emitter} = require("@socket.io/redis-emitter");
const {createClient} = require("redis");

const connect = async () => {
    const redisClient = createClient({url: `redis://${REDIS_SOCKET_HOST}:${REDIS_SOCKET_PORT}`});
    redisClient.on("connect", () => {
        console.debug("connected to redis server");
    });

    // Ожидание соединения
    await redisClient.connect();
    const io = new Emitter(redisClient);

    amqp.connect(`amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`, function (errorConnect, connection) {
        if (errorConnect) {
            console.error(errorConnect)
            process.exit(-1);
        }
        console.debug("connect sendToFront rabbit ok")
        amqpConnection = connection
        connection.createChannel(function (errorChannel, channel) {
            if (errorChannel) {
                console.error(errorChannel)
                process.exit(-1);
            }
            console.debug("create sendToFront rabbit channel ok")

            let amqpChannelFront = channel

            amqpChannelFront.assertQueue(rabbitQueueSendToFront, {
                // durable: false
            });

            // А тут мы слушаем что нужно сделать
            amqpChannelFront.consume(rabbitQueueSendToFront, function (msg) {
                // let seconds = 20
                // let waitTill = new Date(new Date().getTime() + seconds * 1000);
                // while(waitTill > new Date()){}

                data = msg.content.toString()
                let d = new Date().toLocaleString()
                console.log("[x] " + d + "  ToFront %s ", data)

                let entData = JSON.parse(data)

                if (typeof (entData.body) !== 'string') {
                    entData.body = JSON.stringify(entData)
                }
                // Отправить на сокеты
                io.emit(entData.event, entData.body)
            }, {
                noAck: true
            });


        });
    });


}

connect().catch(console.error);
