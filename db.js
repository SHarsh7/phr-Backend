const mongodb=require ('mongoose');
const dotenv = require("dotenv");
dotenv.config();
const mongodbUri=process.env.DB_URL;

const { default: mongoose } = require('mongoose');
//init gfs


const conetectMongo =()=>{
    
   mongodb.connect(mongodbUri,()=>{
        console.log("Connected to mongo!");
    })

}



module.exports =conetectMongo;