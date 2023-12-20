const mongoose = require('mongoose');
const validator = require('validator')
const { Schema } = mongoose;

// * Creation of User Schema
const userSchema = new mongoose.Schema({

    UserId: {
        type: String,
        required: true,
        unique: true
    },

    Name: {
        type: String,
        required: true,
        trim: true,
    },

    Age: {
        type: Number,
    },

    Email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },

    Password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.includes("password")) {
                throw new Error("It cannot be word password!");
            }
        },
    },

    IsAdmin: {
        type: Boolean,
        default: false,
    },

}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// * Creation of model
module.exports = mongoose.model('Users', userSchema);