const express = require('express')
const cors = require('cors');
const app = express();
require('./db/connectdb')
const usersRouter = require('./Routers/UserRouter');

// * Connecting To Port
const port = 1126;
app.use(cors());

// {
  // origin: "http://localhost:3000"
// }

// * Automatically parse incoming JSON to an object so we access it in our request handlers
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(usersRouter);
// app.use(taskRouter);
// app.get("/", (req, res) => {
//   res.status(200).json({
//     msg: "Congrats! Backend is deployed successfully..."
//   })
// })

// * listening To Port
app.listen(port, () => {
  console.log(`This is the ${port} active port! Wait for DB Connection...`);
});