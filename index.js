const express= require('express')
const routes = require('./routes/sign')
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app=express()
app.use(express.json())
app.use(cookieParser());
mongoose.connect('mongodb://127.0.0.1:27017/url_shortener_demo')
      .then(() => console.log('MongoDB connected successfully!'))
      .catch(err => console.error('MongoDB connection error:', err));



const PORT=3000;


app.use('/api',routes)

app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})