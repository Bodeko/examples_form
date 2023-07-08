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
import formidable from 'formidable';


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


                    const form = new formidable.IncomingForm();

                    await form.parse(request, (err, fields, files) => {
                        if (err) {
                            console.error('Произошла ошибка при разборе формы:', err);
                            response.statusCode = 500;
                            response.end('Internal server error.');
                            return;
                        }

                        // Получаем информацию о загруженном файле
                        const file = files.file;
                        const tempPath = file.path;
                        const fileName = file.name;

                        // Перемещаем файл в желаемую директорию
                        const destinationPath = `${UPLOAD_DIR}${fileName}`;
                        fs.renameSync(tempPath, destinationPath);

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
