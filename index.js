'use strict'

const PORT = process.env.PORT || 3000;

const express = require('express')
const session = require('express-session')
const path = require('path')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
const Message = require('./models')

const app = express()
const expressWs = require('express-ws')(app)

app.use(express.static(path.join(__dirname, 'static')))
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ 
    extended: true
  }))

app.use(session({
    secret: 'chatting',
    resave: 'true',
    saveUninitialized: 'false',
}))

mongoose.connect('mongodb://localhost:27017/chat', {useNewUrlParser: true})
const db = mongoose.connection

db.on('error', (error) =>{
    console.log(error)
})

db.once('open', () => {
    console.log('Connected to the database.')
})


app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'static/html/login.html'))
})

app.post('/', (req, res) => {
    if(req.body.username){
        req.session.username = req.body.username
        res.redirect('/chat')
    }
    else{
        res.redirect('/')
    }
})

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/html/chat.html'))
})

app.ws('/chat', (ws, req) => {
    ws.on('message', (message) => {
        const data = {
            username: req.session.username,
            message: message,
            date: new Date(),
        }
        Message.create(data, (err, message) => {
            const clients = expressWs.getWss('/chat').clients
            clients.forEach(client => client.send(JSON.stringify(message)))
        })
    })
})

app.listen(PORT)