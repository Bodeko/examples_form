/**
 * Configure RabbitMQ server
 */
const RABBITMQ_DEFAULT_USER = process.env.RABBITMQ_DEFAULT_USER || 'user';
const RABBITMQ_DEFAULT_PASS = process.env.RABBITMQ_DEFAULT_PASS || 'password';
const RABBITMQ_SERVER = process.env.RABBITMQ_SERVER || 'rabbit.mq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;
const RABBITMQ_CONNECTION_URI = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_SERVER}:${RABBITMQ_PORT}`;

const RABBITMQ_QUEUE_SEND_IMAGE= process.env.RABBITMQ_QUEUE_SEND_IMAGE || 'send.image';

/**
 * Configure microservice
 */
const SERVER_NAME = process.env.SERVER_NAME || 'api.send.image';
const SERVER_PORT = process.env.SERVER_PORT || 3000;

const UPLOAD_DIR = '/usr/src/upload/';

/**
 * Modules
 */
import amqp from 'amqplib/callback_api.js';
import { v4 } from 'uuid';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import {fileTypeFromFile} from 'file-type';
import multer from 'multer';

// Создание экземпляра multer и настройка сохранения файла
const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
        // Генерация уникального имени файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        console.log(uniqueSuffix)
        const fileExtension = file.originalname.split('.').pop();
        cb(null, `${uniqueSuffix}.${fileExtension}`);
    },
});

const upload = multer({ storage });


// Функция для проверки файла на тип изображения
async function isImageFile(filePath) {
    const fileTypeResult = await fileTypeFromFile(filePath);
    return fileTypeResult && fileTypeResult.mime.startsWith('image/');
}

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
        await channel.assertQueue(RABBITMQ_QUEUE_SEND_IMAGE, {}, (error) => {
            if (error) {
                console.error(error);
                process.exit(-1);
            }
            console.debug("Image queue asserted");
        });

        /**
         * Step 4
         * Create HTTP server
         */
        http.createServer(async (request, response) => {
            /**
             * Step 5
             * When front sends data, create msg with UUID v4
             */

            console.log("start")

            try {
                if (request.method === 'POST') {
                    const fileID = v4(); // Генерируем уникальный идентификатор для имени файла
                    const fileName = `${fileID}.jpg`; // Имя файла с расширением

                    const fileStream = fs.createWriteStream(UPLOAD_DIR + fileName);

                    request.on('data', (chunk) => {
                        fileStream.write(chunk); // Записываем данные в поток файла
                    });

                    request.on('end', () => {
                        fileStream.end(); // Завершаем поток файла

                        console.log(`Файл ${fileName} успешно сохранен.`);
                        response.statusCode = 200;
                        response.end(`Файл ${fileName} успешно загружен на сервер.`);
                    });
                } else {
                    response.statusCode = 404;
                    response.end('Not found.');
                }
            } catch (error) {
                console.error('Произошла ошибка:', error);
                response.statusCode = 500;
                response.end('Internal server error.');
            }


        }).listen(3000);
    });
});
