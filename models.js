'use strict'

const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    username: {
        type: String
    },
    message: {
        type: String
    },
    date: {
        type: Date,
        index: { expires: '10m' },
    }
})

const Message = mongoose.model('Message', MessageSchema)

module.exports = Message