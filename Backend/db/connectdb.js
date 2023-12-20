const mongoose = require('mongoose')

// * This is the mongodb Atlas connection link
const dbConnect = 'mongodb+srv://taskeen5099:AY2r0MVTD27aMq44@cluster0.dnawuou.mongodb.net/?retryWrites=true&w=majority';

// * Theses are the parameters
const connectionParams = {
    useNewUrlParser: true, useUnifiedTopology: true,
};

// * This is the mongodb Atlas connection
mongoose.connect(dbConnect, connectionParams).then(() => {

    console.log('Hurrah! MongoDB connection successfully established :)');

}).catch((err) => {

    console.log('Sorry Bro! MongoDB is not connected :(', err);

})