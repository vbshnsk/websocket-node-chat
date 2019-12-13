'use strict'

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MessageSchema = new mongoose.Schema({
    username: {
        type: String
    },
    message: {
        type: String
    },
    date: {
        type: Date,
    },
    archived: {
        type: Boolean,
        default: false,
    }
})

const UserSchema = new mongoose.Schema({
    username:{
        type: String,
        unique: true,
    },
    password:{
        type: String
    }
})

MessageSchema.statics.archiveAfter = (message, time) => {   
    setTimeout(() => {
        Message.updateOne(message, { archived: true })
}, time)
}

UserSchema.pre('save', function(next){
    bcrypt.hash(this.password, 5, (err, hash) =>{
        this.password = hash
        next()
    })
})

UserSchema.statics.validate = (user, password, callback) => {
    bcrypt.compare(password, user.password, (err, success) => {
        if(success){
            callback(null, user)
        }
        else{
            callback(err, null)
        }
    })
}

const User = mongoose.model('User', UserSchema)
const Message = mongoose.model('Message', MessageSchema)

module.exports = { Message: Message, User: User }