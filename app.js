const express = require('express');
const mysql = require('mysql2');

const app = express();

app.use(express.json());
app.use(express.static('public'));


const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

db.connect((err) => {
    if(err){
        console.log('Database gagal connect');
        console.log(err);
    } else {
        console.log('Database berhasil connect');
    }
});

app.get('/tasks', (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if(err){
            res.json(err);
        } else {
            res.json(results);
        }
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server berjalan');
});