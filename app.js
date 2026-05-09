const express = require('express');
const Minio = require('minio');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
});

const bucket = 'todoapp';

let tasks = [];

app.get('/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/tasks', async (req, res) => {
    const task = {
        id: Date.now(),
        text: req.body.text,
        done: false
    };

    tasks.push(task);

    const data = JSON.stringify(tasks);

    await minioClient.putObject(
        bucket,
        'tasks.json',
        data
    );

    res.json(task);
});

app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});