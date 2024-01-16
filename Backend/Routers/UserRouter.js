"use strict";
const express = require('express');
const router = express.Router();
const { uploadToCloudinary } = require('../cloudinary/cloudinaryConfig');
const auth = require('../Middleware/auth');
require('dotenv').config();
const multer = require('multer');
const Users = require('../Models/UserModel');
const cloudinary = require('cloudinary').v2;
const upload = multer();

// * Creating Users
router.post('/create-user', upload.single('Image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { UserId, First_Name, Last_Name, Age, Email, Password, IsAdmin, Image } = req.body;
        let text = Age.toString().trim();

        if (text == 0 || text == null || text <= 0) {
            return res.status(401).send({ msg: "The Age should not contain spaces or be negative!" })
        }

        const createdUser = new Users({
            UserId,
            First_Name,
            Last_Name,
            Age: Number(text),
            Email,
            Password,
            Image: " ",
            IsAdmin
        });

        await createdUser.save();
        const result = await uploadToCloudinary(req.file.buffer);
        createdUser.Image = result.secure_url;
        await createdUser.save();

        console.log(new Date().toLocaleString() + ' ' + 'Creating Users...');
        res.status(201).json({ status: true, message: "Users document created successfully", data: { user: createdUser } });
        console.log(new Date().toLocaleString() + ' ' + 'Create Users Document Successfully!');
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating Users document', error: error.message });
    }
});

// * Login route
router.post('/login', async (req, res) => {
    try {
        const user = await Users.findByCredentials(req.body.Email, req.body.Password);
        const token = await user.generateAuthToken();
        console.log(token);
        console.log(new Date().toLocaleString() + ' ' + 'logging Users...');
        res.status(201).json({ status: true, message: "User Login Successfully", token });
        console.log(new Date().toLocaleString() + ' ' + 'User login Successfully!');
    } catch (e) {
        console.log(e.message);
        res.status(400).json({ message: 'Error in Login', error: e.message });
    }
});

// * Logout route
router.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
        await req.user.save();

        res.status(200).json({ message: 'Logout successful' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// * Update a Users document by ID
router.put('/update-users/:usersId', auth, upload.single('Image'), async (req, res) => {
    try {

        // Check if the user is an admin
        if (!req.user.IsAdmin) {
            return res.status(403).json({ status: false, message: 'Unauthorized access' });
        }

        const userid = req.params.usersId;
        const updates = req.body;
        let publicIdToDelete;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);

            const existingUser = await Users.findById(userid);

            if (existingUser && existingUser.Image) {
                const publicIdMatch = existingUser.Image.match(/\/v\d+\/([^\/]+)\./);
                console.log(publicIdMatch)
                if (publicIdMatch) {
                    publicIdToDelete = publicIdMatch[1];
                    console.log("The image Id", publicIdToDelete);
                } else {
                    console.log('Public ID not found in the URL');
                }
            }

            updates.Image = result.secure_url;
        }

        const updatedUsers = await Users.findByIdAndUpdate(userid, updates, { new: true });

        if (!updatedUsers) {
            console.log(`Users document with ID: ${userid} not found`);
            return res.status(404).json({ status: false, message: `Users document with ID: ${userid} not found` });
        }

        if (publicIdToDelete) {
            await cloudinary.uploader.destroy(publicIdToDelete);
            console.log('Old image deleted from Cloudinary:', publicIdToDelete);
        }

        console.log(`Users document with ID: ${userid} updated successfully`);
        res.status(200).json({ status: true, message: 'Users document updated successfully', data: updatedUsers });

    } catch (error) {
        console.error('Error updating Users document:', error.message);
        res.status(500).json({ status: false, message: 'Error updating Users document', error: error.message });
    }
});

// * Update own user profile
router.put('/update-my-profile', auth, upload.single('Image'), async (req, res) => {
    try {
        const user = req.user;
        const updates = req.body;
        let publicIdToDelete;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            const publicIdMatch = user.Image.match(/\/v\d+\/([^\/]+)\./);
            console.log(publicIdMatch)
            if (publicIdMatch) {
                publicIdToDelete = publicIdMatch[1];
                console.log("The image Id", publicIdToDelete);
            } else {
                console.log('Public ID not found in the URL');
            }
            updates.Image = result.secure_url;
        }

        const updatedUser = await Users.findByIdAndUpdate(user._id, updates, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (publicIdToDelete) {
            await cloudinary.uploader.destroy(publicIdToDelete);
            console.log('Old image deleted from Cloudinary:', publicIdToDelete);
        }

        console.log(`User with ID: ${user._id} updated their profile successfully`);
        res.status(200).json({ status: true, message: 'User profile updated successfully', data: updatedUser });
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        res.status(500).json({ status: false, message: 'Error updating user profile', error: error.message });
    }
});

// * Get all Users documents
router.get('/get-all-users', auth, async (req, res) => {
    try {

        // Check if the user is an admin
        if (!req.user.IsAdmin) {
            return res.status(403).json({ status: false, message: 'Unauthorized access' });
        }

        const users = await Users.find();
        if (!users) {
            console.log('Users documents not found');
            return res.status(404).json({ message: 'Users not found' });
        }
        const userCount = await Users.countDocuments();

        console.log('Users documents retrieved successfully');
        res.status(200).json({ status: true, Total: userCount, data: users });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting Users documents', error: error.message });
    }
});

// * Get a Users document by ID
router.get('/get-users/:usersId', auth, async (req, res) => {

    try {

        // Check if the user is an admin
        if (!req.user.IsAdmin) {
            return res.status(403).json({ status: false, message: 'Unauthorized access' });
        }

        const userid = req.params.usersId;
        const users = await Users.findById(userid);

        if (!users) {
            console.log(`Users document with ID: ${userid} not found`);
            return res.status(404).json({ message: `Users document with ID: ${userid} not found` });
        }

        console.log(`Users document with ID: ${userid} retrieved successfully`);
        res.status(200).json({ status: true, data: users });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting User document', error: error.message });
    }
});

// * Delete a Users document by ID
router.delete('/delete-users/:usersId', auth, async (req, res) => {
    try {

        // Check if the user is an admin
        if (!req.user.IsAdmin) {
            return res.status(403).json({ status: false, message: 'Unauthorized access' });
        }

        const userid = req.params.usersId;

        const existingUser = await Users.findById(userid);

        if (!existingUser) {
            console.log(`Users document with ID: ${userid} not found`);
            return res.status(404).json({ message: `Users document with ID: ${userid} not found` });
        }

        let publicIdToDelete;
        if (existingUser.Image) {
            const publicIdMatch = existingUser.Image.match(/\/v\d+\/([^\/]+)\./);
            if (publicIdMatch) {
                publicIdToDelete = publicIdMatch[1];
            } else {
                console.log('Public ID not found in the URL');
            }
        }

        const deletedUsers = await Users.findByIdAndDelete(userid);

        if (!deletedUsers) {
            console.log(`Users document with ID: ${userid} not found`);
            return res.status(404).json({ message: `Users document with ID: ${userid} not found` });
        }

        if (publicIdToDelete) {
            await cloudinary.uploader.destroy(publicIdToDelete);
            console.log('Image deleted from Cloudinary:', publicIdToDelete);
        }

        console.log(`Users document with ID: ${userid} deleted successfully`);
        res.status(200).json({ status: true, message: 'Users document deleted successfully', data: deletedUsers });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting Users document', error: error.message });
    }
});

// * Delete all Users documents
router.delete('/delete-all-users', auth, async (req, res) => {
    try {

        // Check if the user is an admin
        if (!req.user.IsAdmin) {
            return res.status(403).json({ status: false, message: 'Unauthorized access' });
        }

        const allUsers = await Users.find({});
        if (allUsers.length === 0) {
            return res.status(404).send({ status: false, message: "No Users documents found to delete!" });
        }

        for (const user of allUsers) {
            if (user.Image) {
                const publicIdMatch = user.Image.match(/\/v\d+\/([^\/]+)\./);
                if (publicIdMatch) {
                    const publicIdToDelete = publicIdMatch[1];
                    await cloudinary.uploader.destroy(publicIdToDelete);
                    console.log('Image deleted from Cloudinary:', publicIdToDelete);
                } else {
                    console.log('Public ID not found in the URL');
                }
            }
        }

        const result = await Users.deleteMany({});

        res.status(200).send({ status: true, message: "All Users documents and associated images have been deleted!", data: result });
        console.log(new Date().toLocaleString() + ' ' + 'DELETE All Users documents and associated images Successfully!');

    } catch (e) {
        console.error(e.message);
        res.status(500).json({ message: e.message });
    }
});

// * Get own user profile
router.get('/my-profile', auth, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({ status: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting user profile', error: error.message });
    }
});

// * Delete own user profile
router.delete('/delete-my-profile', auth, async (req, res) => {
    try {
        const user = req.user;
        let publicIdToDelete;

        const publicIdMatch = user.Image.match(/\/v\d+\/([^\/]+)\./);
        if (publicIdMatch) {
            publicIdToDelete = publicIdMatch[1];
        } else {
            console.log('Public ID not found in the URL');
        }


        const deletedUser = await Users.findByIdAndDelete(user._id);
        if (!deletedUser) {
            console.log(`Users document with ID: ${user._id} not found`);
            return res.status(404).json({ message: `Users document with ID: ${user._id} not found` });
        }

        if (publicIdToDelete) {
            await cloudinary.uploader.destroy(publicIdToDelete);
            console.log('Image deleted from Cloudinary:', publicIdToDelete);
        }

        console.log(`User with ID: ${user._id} deleted their profile successfully`);
        res.status(200).json({ status: true, message: 'User profile deleted successfully', data: deletedUser });
    } catch (error) {
        console.error('Error deleting user profile:', error.message);
        res.status(500).json({ status: false, message: 'Error deleting user profile', error: error.message });
    }
});

module.exports = router;