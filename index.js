const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://peace-donation.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("peace-assignment");
    const collection = db.collection("users");
    const donationCollection = db.collection("donations");
    const donorCollection = db.collection("donors");
    const testimonialCollection = db.collection("testimonials");
    const volunteerCollection = db.collection("volunteers");
    const commentCollection = db.collection("comments");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, role, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({
        name,
        email,
        role: "user",
        password: hashedPassword,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE

    //* Donation Data
    app.post("/api/v1/donation", async (req, res) => {
      const { image, title, category, amount, description } = req.body;
      const result = await donationCollection.insertOne({
        image,
        title,
        category,
        amount,
        description,
      });
      res.json({
        success: true,
        message: "Successfully donation create!",
        result,
      });
    });
    app.get("/api/v1/donation", async (req, res) => {
      const data = await donationCollection.find({}).toArray();
      res.json({
        success: true,
        message: "successfully retrieve donation!",
        data,
      });
    });
    app.get("/api/v1/donation/:id", async (req, res) => {
      const { id } = req.params;
      const data = await donationCollection.findOne(new ObjectId(id));
      res.json({
        success: true,
        message: "successfully retrieve clothe!",
        data,
      });
    });
    app.delete("/api/v1/donation/:id", async (req, res) => {
      const { id } = req.params;
      const data = await donationCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json({
        success: true,
        message: "successfully delete donation!",
        data,
      });
    });

    //* Donor Data
    app.post("/api/v1/donor", async (req, res) => {
      const { email, name, image, amount, donationPost } = req.body;
      const existingUser = await donorCollection.findOne({ email });

      if (!existingUser) {
        const result = await donorCollection.insertOne({
          email,
          name,
          image,
          amount,
          donationPosts: [donationPost], // Initialize with the first donation post
        });

        return res.json({
          success: true,
          message: "You provided a donation successfully!",
          result,
        });
      } else {
        const previousAmount = existingUser.amount;
        const updatedAmount = previousAmount + amount;

        const data = await donorCollection.updateOne(
          { email: email },
          {
            $set: { amount: updatedAmount },
            $push: { donationPosts: donationPost }, // Push the new donation post into the array
          }
        );

        return res.json({
          success: true,
          message: "Donation updated successfully!",
          data,
        });
      }
    });

    app.get("/api/v1/donor", async (req, res) => {
      const data = await donorCollection.find({}).toArray();
      res.json({
        success: true,
        message: "successfully retrieve donors!",
        data,
      });
    });
    app.get("/api/v1/donor/:email", async (req, res) => {
      const { email } = req.params;
      const data = await donorCollection.findOne({ email });
      res.json({
        success: true,
        message: "successfully retrieve donor!",
        data,
      });
    });

    //* Testimonial Data
    app.post("/api/v1/testimonial", async (req, res) => {
      const { email, image, name, amount, testimonial } = req.body;
      const existingUser = await testimonialCollection.findOne({ email });

      if (!existingUser) {
        const result = await testimonialCollection.insertOne({
          email,
          name,
          image,
          amount,
          testimonial,
        });

        return res.json({
          success: true,
          message: "You posted testimonial successfully!",
          result,
        });
      } else {
        const updatedAmount = amount;
        const data = await testimonialCollection.updateOne(
          { email: email },
          { $set: { amount: updatedAmount } },
          { $set: { testimonial: testimonial } }
        );

        res.json({
          success: true,
          message: "Your testimonial Updated successfully!",
          updatedDonation: data,
        });
      }
    });
    app.get("/api/v1/testimonial", async (req, res) => {
      const data = await testimonialCollection.find({}).toArray();
      res.json({
        success: true,
        message: "successfully retrieve Testimonials!",
        data,
      });
    });

    //* Volunteer Data
    app.post("/api/v1/volunteer", async (req, res) => {
      const { image, name, email, passion, phoneNumber, location } = req.body;
      const existingUser = await volunteerCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "You Have already created account for Volunteer",
        });
      } else {
        const result = await volunteerCollection.insertOne({
          image,
          name,
          email,
          passion,
          phoneNumber,
          location,
        });
        res.json({
          success: true,
          message: "Volunteer Account Created Successfully!",
          result,
        });
      }
    });
    app.get("/api/v1/volunteer", async (req, res) => {
      const data = await volunteerCollection.find({}).toArray();
      res.json({
        success: true,
        message: "successfully retrieve volunteers!",
        data,
      });
    });
    //* Comment Data
    app.post("/api/v1/comment", async (req, res) => {
      const { image, name, email, comment } = req.body;
      const currentDate = new Date();
      const options = { day: "numeric", month: "long", year: "numeric" };
      const formattedDate = currentDate.toLocaleDateString("en-US", options);

      const result = await commentCollection.insertOne({
        image,
        name,
        email,
        comment,
        time: formattedDate,
      });
      res.json({
        success: true,
        message: "Comment Posted Successfully!",
        result,
      });
    });
    app.get("/api/v1/comment", async (req, res) => {
      const data = await commentCollection.find({}).toArray();
      res.json({
        success: true,
        message: "successfully retrieve comments!",
        data,
      });
    });

    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Peace server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
