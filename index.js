'use strict'

const PORT = process.env.PORT || 3000;

const express = require('express')
const session = require('express-session')
const path = require('path')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
const Message = require('./models').Message
const User = require('./models').User
const MongoStore = require('connect-mongo')(session)
const EventEmitter =  require('events').EventEmitter
const emmiter = new EventEmitter()

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
        maxAge: 60 * 60 * 1000,
    },
    store: new MongoStore({
        mongooseConnection: db,
        autoRemove: 'interval',     
        autoRemoveInterval: 1,
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
    if(req.session.username)
        res.redirect('/chat')
    else
        res.sendFile(path.join(__dirname, 'static/html/login.html'))

})

app.post('/', (req, res) => {
    User.findOne({ username: req.body.username }, (err, user) =>{
        User.validate(user, req.body.password, (err, user) =>{
            if(err)
                res.redirect('/')
            else {
                emmiter.emit('loggedIn', user.username)
                req.session.username = user.username
                res.redirect('/chat')
            }
        })
    })
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/html/register.html'))
})

app.post('/register', (req, res) =>{
    if(req.body.password === req.body.passwordConfirmation){
        const userData = {
            username: req.body.username,
            password: req.body.password,
        }
        User.create(userData, (err, user) =>{
            if(err)
                res.redirect('/register')
            res.redirect('/')
        })
    }
    else{
        res.redirect('/register')
    }
})

app.get('/chat', (req, res) => {
    Message.find({ archived: false }, (err, messages) => {
        db.collection('sessions')
        .find({ })
        .map(document => JSON.parse(document.session).username ? JSON.parse(document.session).username : 'Guest').toArray()
        .then(users =>{
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
            Message.archiveAfter(message, 60000)
            clients.forEach(client =>{ 
                data.current = client === ws
                client.send(JSON.stringify(data))
            })
        })
    })
})

app.get('/logout', (req, res) =>{
    req.session.destroy()
    res.redirect('/')
})

app.get('/archive', (req, res) => {
    Message.find({ archived: true }, (err, messages) =>{
        res.render('archive', {messages: messages, client: req.session.username})
    })
})

app.listen(PORT)