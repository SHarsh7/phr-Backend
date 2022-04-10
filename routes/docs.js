const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const router = express.Router();
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const { GridFsStorage } = require("multer-gridfs-storage");
const { mongoose } = require("mongoose");
const Grid = require("gridfs-stream");
const ObjectId = mongoose.Types.ObjectId;

const dotenv = require("dotenv");
dotenv.config();

//init gfs
let gfs;
const db = mongoose.connection;
db.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "uploads",
  });
  gfs = Grid(db, mongoose.mongo);
  gfs.collection("uploads");
});
//making a stroage unit
const storage = new GridFsStorage({
  url: process.env.DB_URL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buff) => {
        if (err) {
          return reject(err);
        }
        let userId = req.user.id;
        const filename = buff.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          metadata: {
            uploadName: file.originalname,
            user: userId,
          },
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

// middle ware to upload file
const upload = multer({ storage });

//ROUTE 1: Upload the document
// Login required
router.post("/upload", fetchuser, upload.single("file"), async (req, res) => {
  try {
    let success = false;
    if (req.file) {
      success = true;
      res.json({ success, file: req.file });
    } else {
      res.status(401).send({ success, msg: "File cant be empty" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong!");
  }
});

//ROUTE 2: display all the files related to user
router.get("/getfiles", fetchuser, async (req, res) => {
  try {
    gfs.files.find().toArray((err, files) => {
      const userFiles = files.filter(file => {
        return file.metadata.user == req.user.id;
      });
      return res.json(userFiles);
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong!");
  }
});
//Route 2.1 : Get files based on ID
router.get("/getfiles/:id", fetchuser, async (req, res) => {
  try {
    gfs.files.find().toArray((err, files) => {
      const userFiles = files.filter(file => {
        return file.metadata.user == req.params.id;
      });
      return res.json(userFiles);
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong!");
  }
});

//Route 3 : GEt a single file
router.get("/file/:filename", fetchuser, async (req, res) => {
  try {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      //check if file
      if (!file || file.lenght == 0) {
        return res.status(404).json({ msg: "NO file exists!" });
      }

      //file exists
      return res.json(file);
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong!");
  }
});

//Route 4: Read a single file

router.get("/readfile/:filename", async (req, res) => {
  try {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      //check if file
      if (!file || file.lenght == 0) {
        return res.status(404).json({ msg: "NO file exists!" });
      }
      //file exists
      const readStream = gridfsBucket.openDownloadStream(file._id);
      readStream.pipe(res);
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong!");
  }
});
//Route 5 : Delete a file
router.delete("/deletefile/:id", async (req, res) => {
  try {
    gfs.files.deleteOne({ _id: new ObjectId(req.params.id) }, (err, result) => {
      if (err) {
        res.status(401).send({msg:"Failed"});
      } else {
        res.status(200).send({ msg: "Success" });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ msg: "Something went wrong!" });
  }
});

module.exports = router;
