const conetectMongo=require('./db');
const express = require('express');
const cors = require('cors')
const dotenv = require('dotenv');

dotenv.config();
conetectMongo();


const app = express()
const port = process.env.PORT  || 8000;
app.use(cors())
app.use(express.json())

//Routes
app.use('/api/auth',require('./routes/auth'))
app.use('/api/docs',require('./routes/docs'))
app.use('/api/accessgiven',require('./routes/accessgiven'));


app.listen(port, () => {
  console.log(`APP is on port ${port}`)
})