'use strict'

const PORT = process.env.PORT || 3000;

const express = require('express')
const session = require('express-session')
const path = require('path')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
const Message = require('./models')
const MongoStore = require('connect-mongo')(session)

const app = express()
const expressWs = require('express-ws')(app)

app.use(express.static(path.join(__dirname, 'static')))
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ 
    extended: true
  }))


//mongoose.connect('mongodb://localhost:27017/chat', {useNewUrlParser: true})
mongoose.connect('mongodb+srv://vlad:212121121989gasp@cluster0-lo97k.mongodb.net/chat?retryWrites=true&w=majority', {useNewUrlParser: true})
const db = mongoose.connection

app.use(session({
    secret: 'chatting',
    resave: true,
    saveUninitialized: true,
    cookie:{
        maxAge: 60 * 1000,
    },
    store: new MongoStore({
        mongooseConnection: db,
     }),
}))

db.on('error', (error) =>{
    console.log(error)
})

db.once('open', () => {
    console.log('Connected to the database.')
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'static/html/login.html'))
})

app.post('/', (req, res) => {
    if(req.body.username){
        req.session.regenerate(err => {
            req.session.username = req.body.username
        req.session.save((err) => {
            res.redirect('/chat')
           })
        })
    }
    else{
        res.redirect('/')
    }
})

app.get('/chat', (req, res) => {
    Message.find({ }, (err, messages) => {
        db.collection('sessions')
        .find({ })
        .map(document => JSON.parse(document.session).username).toArray()
        .then(users =>{
            console.log(users)
            req.session.touch()
            res.render('chat', {messages: messages, client: req.session.username, users: users})
        })
    })
})

app.ws('/chat', (ws, req) => {
    ws.on('message', (message) => {
        const data = {
            username: req.session.username ? req.session.username : 'Guest',
            message: message,
            date: new Date(),
        }
        Message.create(data, (err, message) => {
            const clients = expressWs.getWss('/chat').clients
            clients.forEach(client =>{ 
                data.current = client === ws
                client.send(JSON.stringify(data))
            })
        })
    })
})

app.listen(PORT)