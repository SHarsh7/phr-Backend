const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

//ROUTE 1 : Creating a user using  POST "api/auth/createuser" NO login req
router.post(
  "/createuser",
  [
    body("name", "Name must be of Grater then 2 chars").isLength({ min: 2 }),
    body("email", "Invalild E-mail ID").isEmail(),
    body("password", "Password must be of 7 chars").isLength({ min: 7 }),
  ],
  async (req, res) => {
    //Data Validation
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    //check user exist or not
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        //user alerady exists return false
        return res.status(400).json({ success, errors: "User alerad exsist" });
      }
      // New User  store the data 

      // Encryption of password 
      let salt = bcrypt.genSaltSync(10);
      let encPass = await bcrypt.hash(req.body.password, salt);

      //  Storing data in DB 
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: encPass,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      //Signing the token using JWT
      var token = jwt.sign(data, JWT_SECRET);
      success = true;
      // Return success and web token 
      res.json({ success, token });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Something went wrong!");
    }
  }
);

//ROUTE 2 : User login   (login not req)

router.post(
  "/login",
  [
    body("email", "Invalild E-mail ID").isEmail(),
    body("password", "Invalid credentials").exists(),
  ],
  async (req, res) => {
    //Data Validation
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check user exists or not
      let user = await User.findOne({ email }); 

      if (!user) {
        /*
            User donot exists 
            return false 
        */
        return res.status(400).json({ success, errors: "Invalid credentials" });
      }
        /*  
            User exists 
            Check password is correct ? 
        */
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        //Invalid password
        return res.status(400).json({ success, errors: "Invalid credentials" });
      }
      /*
            User exists and password is correct
            Sign the token and send
      */
      const data = {
        user: {
          id: user.id,
        },
      };
      var token = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, token });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Something went wrong!");
    }
  }
);

//ROUTE 3 : Login and get user info
router.get(
  "/getuser/:id",fetchuser,async (req, res) => {try {
    let userId= req.params.id;
  
    const user= await User.findById(userId).select("-password");
    
    return res.send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong!");
  }});


module.exports = router;
