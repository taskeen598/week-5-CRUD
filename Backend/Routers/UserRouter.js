const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Users = require('../Models/UserModel');

// * Create a new User document
router.post('/create-user', [
    body('UserId').notEmpty().withMessage('UserId is required'),
    body('Name').notEmpty().withMessage('Name is required'),
    body('Email').isEmail().withMessage('Invalid email address'),
    body('Password').isLength({ min: 7 }).withMessage('Password must be at least 7 characters long'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, errors: errors.array() });
    }

    try {
        const createdUsers = new Users({
            ...req.body
        });

        await createdUsers.save();
        console.log(new Date().toLocaleString() + ' ' + 'Creating Users...');

        res.status(201).json({ status: true, message: "Users document created successfully", data: createdUsers });
        console.log(new Date().toLocaleString() + ' ' + 'Create Users Document Successfully!');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating Users document', error: error.message });
    }
});

// * Update a Users document by ID
router.put('/update-users/:usersId', [
    param('usersId').notEmpty().withMessage('UserId is required'),
    body('UserId').optional(),
    body('Name').optional(),
    body('Email').optional().isEmail().withMessage('Invalid email address'),
    body('Password').optional().isLength({ min: 7 }).withMessage('Password must be at least 7 characters long'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, errors: errors.array() });
    }

    try {
        const userid = req.params.usersId;
        const updates = req.body;

        const updatedUsers = await Users.findByIdAndUpdate(userid, updates, { new: true });

        if (!updatedUsers) {
            console.log(`Users document with ID: ${userid} not found`);
            return res.status(404).json({ status: false, message: `Users document with ID: ${userid} not found` });
        }

        console.log(`Users document with ID: ${userid} updated successfully`);
        res.status(200).json({ status: true, message: 'Users document updated successfully', data: updatedUsers });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Error updating Users document', error: error.message });
    }
});

// * Get all Users documents
router.get('/get-all-users', async (req, res) => {
    try {
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
router.get('/get-users/:usersId', [
    param('usersId').notEmpty().withMessage('UserId is required')
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, errors: errors.array() });
    }

    try {
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
router.delete('/delete-users/:usersId', [
    param('usersId').notEmpty().withMessage('UserId is required')
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, errors: errors.array() });
    }

    try {
        const userid = req.params.usersId;
        const deletedUsers = await Users.findByIdAndDelete(userid);

        if (!deletedUsers) {
            console.log(`Users document with ID: ${userid} not found`);
            return res.status(404).json({ message: `Users document with ID: ${userid} not found` });
        }

        console.log(`Users document with ID: ${userid} deleted successfully`);
        res.status(200).json({ status: true, message: 'Users document deleted successfully', data: deletedUsers });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting Users document', error: error.message });
    }
});

// * Delete all Users documents
router.delete('/delete-all-users', async (req, res) => {
    try {
        const result = await Users.deleteMany({});
        if (result.deletedCount === 0) {
            return res.status(404).send({ status: false, message: "No Users documents found to delete!" });
        }

        res.status(200).send({ status: true, message: "All Users documents have been deleted!", data: result });
        console.log(new Date().toLocaleString() + ' ' + 'DELETE All Users documents Successfully!');

    } catch (e) {
        console.error(e.message);
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;