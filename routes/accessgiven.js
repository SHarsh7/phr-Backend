const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const Accessgiven = require("../models/Accessgiven");
const Accessfrom = require("../models/Accessfrom");
const fetchuser = require("../middleware/fetchuser");
const User = require("../models/User");

//Route 1: adding a into accessgiven viz-a-viz in acessfrom
router.post(
  "/addFriend",
  fetchuser,
  [body("email", "Invalild E-mail ID").isEmail()],
  async (req, res) => {
    let success = false;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let friend = await User.findOne({ email: req.body.email }).select(
        "-password"
      );

      if (!friend) {
        return res
          .status(200)
          .send({ success, msg: "Your frined needs to have an account!" });
      }
      if (req.user.id === friend._id.toString()) {
        return res.status(200).send({ success, msg: "You can't add yourself" });
      }
      let currUser = await User.findById(req.user.id).select("-password");

      let existingFriend = (
        await Accessgiven.find({ uids: friend._id })
      ).filter(f => {
        return f.user.toString() === req.user.id;
      });
      let existingUser = (await Accessfrom.find({ user: friend._id })).filter(
        f => {
          return f.uids === req.user.id;
        }
      );
      if (existingFriend.length !== 0 || existingUser.length !== 0) {
        return res.status(200).send({ success, msg: "Already Exists!" });
      }
      Accessgiven.create({
        name: friend.name,
        uids: friend._id,
        user: req.user.id,
      }).then(
        Accessfrom.create({
          user: friend._id,
          name: currUser.name,
          uids: currUser._id,
        }).then(notes => {
          success = true;
          return res.json({ success, notes });
        })
      );
    } catch (error) {
      return res.status(500).send({ msg: error });
    }
  }
);

//Route 2: Get all friends according to accessgiven
router.get("/accessGiven", fetchuser, async (req, res) => {
  try {
    const friends = await Accessgiven.find({ user: req.user.id });
    res.json(friends);
  } catch (error) {
    res.status(500).send({ msg: error.msg });
  }
});

// Route 3 : get all friends from whome user has access
router.get("/accessFrom", fetchuser, async (req, res) => {
  try {
    const friends1 = await Accessfrom.find({ user: req.user.id });
    res.json(friends1);
  } catch (error) {
    res.status(500).send({ msg: error.msg });
  }
});

//Route 4 : Remove access
router.delete("/delteFriend/:id", fetchuser, async (req, res) => {
  try {
    let removeFriend = await Accessgiven.findOneAndDelete({
      uids: req.params.id,
    });
    let removeUser = await Accessfrom.findOneAndDelete({ user: req.params.id });
    if (removeFriend && removeUser) {
      console.log(removeUser);
      res.send({ msg: "success" });
    } else {
      res.send({ msg: "Access is not given to any such user" });
    }
  } catch (error) {
    res.status(500).send({ msg: error.msg });
  }
});
module.exports = router;
