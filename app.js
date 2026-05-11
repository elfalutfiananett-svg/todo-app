const express = require('express');
const session = require('express-session');
const Minio = require('minio');

const app = express();

app.use(express.json());

app.use(session({
    secret: 'todo-secret',
    resave: false,
    saveUninitialized: true
}));

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

const users = [

    {
        username: 'admin',
        password: '123'
    },

    {
        username: 'elfa',
        password: '13april'
    },

    {
        username: 'user',
        password: '12345'
    }

];

async function saveTasksToMinio() {

    const data = JSON.stringify(tasks);

    await minioClient.putObject(
        bucket,
        'tasks.json',
        data
    );

}

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

            try {

                if(data){

                    tasks = JSON.parse(data);

                    console.log('Tasks berhasil dimuat');

                }else{

                    tasks = [];

                }

            } catch(err){

                console.log('Error membaca tasks.json');

                tasks = [];

            }

        });

    } catch(err){

        console.log('Belum ada tasks.json');

        tasks = [];

        await saveTasksToMinio();

    }

}

loadTasksFromMinio();

app.post('/login', (req, res) => {

    const { username, password } = req.body;

    const user = users.find(u =>

        u.username === username &&
        u.password === password

    );

    if(user){

        req.session.user = user;

        res.json({
            success: true
        });

    } else {

        res.json({
            success: false
        });

    }

});

app.get('/logout', (req, res) => {

    req.session.destroy(() => {

        res.redirect('/login.html');

    });

});

app.get('/tasks', (req, res) => {

    if(!req.session.user){

        return res.status(401).json({
            message: 'Harus login'
        });

    }

    const userTasks = tasks.filter(task =>

        task.owner === req.session.user.username

    );

    res.json(userTasks);

});

app.post('/tasks', async (req, res) => {

    try {

        if(!req.session.user){

            return res.status(401).json({
                message: 'Harus login'
            });

        }

        const task = {

    id: Date.now(),
    text: req.body.text,
    done: false,
    owner: req.session.user.username

};

        tasks.push(task);

        await saveTasksToMinio();

        res.json(task);

    } catch(err){

        res.status(500).json({
            message: 'Gagal menambah task'
        });

    }

});

app.put('/tasks/:id', async (req, res) => {

    try {

        if(!req.session.user){

            return res.status(401).json({
                message: 'Harus login'
            });

        }

        const id = Number(req.params.id);

        tasks = tasks.map(task => {

            if(task.id === id){

                task.done = true;

            }

            return task;

        });

        await saveTasksToMinio();

        res.json({
            message: 'Task selesai'
        });

    } catch(err){

        res.status(500).json({
            message: 'Gagal update task'
        });

    }

});

app.delete('/tasks/:id', async (req, res) => {

    try {

        if(!req.session.user){

            return res.status(401).json({
                message: 'Harus login'
            });

        }

        const id = Number(req.params.id);

        tasks = tasks.filter(task => task.id !== id);

        await saveTasksToMinio();

        res.json({
            message: 'Task dihapus'
        });

    } catch(err){

        res.status(500).json({
            message: 'Gagal hapus task'
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server berjalan di port ${PORT}`);

});