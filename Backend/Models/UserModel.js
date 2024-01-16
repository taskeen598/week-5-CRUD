"use strict";
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config()

// * Creation of User Schema
const userSchema = new mongoose.Schema({
    UserId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: value => validator.isAlphanumeric(value) && !validator.isEmpty(value) && !/\b(?:true|false)\b/i.test(value),
            message: 'UserId should be alphanumeric, not empty, and should not contain the words "true" or "false"!',
        },
    },

    First_Name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: value => validator.isAlpha(value) && !validator.isEmpty(value) && !/\b(?:true|false)\b/i.test(value),
            message: 'First Name should only contain alphabets, not be empty, and should not contain the words "true" or "false"!',
        },
    },

    Last_Name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: value => validator.isAlpha(value) && !validator.isEmpty(value) && !/\b(?:true|false)\b/i.test(value),
            message: 'Last Name should only contain alphabets, not be empty, and should not contain the words "true" or "false"!',
        },
    },

    Age: {
        type: Number,
        required: [true, 'Age is required'],
    },

    Email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: value => validator.isEmail(value) && !validator.isEmpty(value),
            message: 'Email is invalid! or cannot be empty',
        },
    },

    Password: {
        type: String,
        required: true,
        minlength: 8,
        validate: {
            validator: value => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(value),
            message: 'Password must contain at least 8 characters, including one lowercase letter, one uppercase letter, one digit, and one special character.',
        },
    },

    Image: {
        type: String,
        required: true,
    },

    IsAdmin: {
        type: Boolean,
        default: false,
    },

    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.Password;
    delete userObject.tokens;
    return userObject;
};

// * Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('Password')) {
        user.Password = await bcrypt.hash(user.Password, 8);
    }

    next();
});

// * Generate an authentication token
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, "thisismynewcourse");
    // , { expiresIn: '1m' }

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await users.findOne({ Email: email });
    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
};

// * Creation of model
const users = mongoose.model('Users', userSchema);
module.exports = users;