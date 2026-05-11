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

async function loadTasksFromMinio() {

    try {

        const dataStream = await minioClient.getObject(
            bucket,
            'tasks.json'
        );

        let data = '';

        dataStream.on('data', chunk => {
            data += chunk;
        });

        dataStream.on('end', () => {

            if (data) {
                tasks = JSON.parse(data);
            }

        });

    } catch (err) {

        console.log('Belum ada tasks.json');

    }
}

loadTasksFromMinio();

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

app.put('/tasks/:id', async (req, res) => {

    const id = Number(req.params.id);

    tasks = tasks.map(task => {

        if (task.id === id) {
            task.done = true;
        }

        return task;
    });

    const data = JSON.stringify(tasks);

    await minioClient.putObject(
        bucket,
        'tasks.json',
        data
    );

    res.json({
        message: 'Task selesai'
    });

});

app.delete('/tasks/:id', async (req, res) => {

    const id = Number(req.params.id);

    tasks = tasks.filter(task => task.id !== id);

    const data = JSON.stringify(tasks);

    await minioClient.putObject(
        bucket,
        'tasks.json',
        data
    );

    res.json({
        message: 'Task dihapus'
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);

});