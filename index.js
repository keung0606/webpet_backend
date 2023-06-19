const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const CatModel = require('./models/Cats');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
const UserModel = require('./models/Users');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MessageModel = require('./models/Message');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(
  new GoogleStrategy(
    {
      clientID: '923985052259-ttu40k8lgd3rh2epcfqadm9a4ht36284.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          // User already exists, call the done() function with the user object
          return done(null, existingUser);
        }

        // User doesn't exist, create a new user with the provided profile information
        const newUser = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
        });

        // Save the new user to the database
        await newUser.save();

        // Call the done() function with the newly created user object
        done(null, newUser);
      } catch (error) {
        // Handle any errors that occur during the database operations
        done(error, null);
      }
    }  
  )
);

const app = express();
app.use(cors());
app.use(express.json());


// Google authentication routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to the desired route
    res.redirect('/viewCats');
  }
);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/petweb_db');

// Define Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cat API',
      version: '1.0.0',
      description: 'API endpoints for managing cats',
    },
    components: {
      schemas: {
        Cat: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            gender: { type: 'string' },
            age: { type: 'number' },
            breed: { type: 'string' },
          },
          required: ['name', 'gender', 'age', 'breed'],
        },
        User: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
            userStatus: { type: 'number' },
          },
          required: ['username', 'password', 'userStatus'],
        },
        Message: {
          type: 'object',
          properties: {
            sender: { type: 'string' },
            recipient: { type: 'string' },
            message: { type: 'string' },
            response: { type: 'string' },
          },
          required: ['sender', 'recipient', 'message'],
        },
      },
    },
  },

  apis: ['./index.js'], // Specify the file containing your API route definitions
};

// Initialize Swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /:
 *   get:
 *     summary: Get all cats
 *     responses:
 *       200:
 *         description: Success
 */
app.get('/', (req, res) => {
  CatModel.find()
    .then((cats) => res.json(cats))
    .catch((err) => res.json(err));
});

/**
 * @openapi
 * /getCat/{id}:
 *   get:
 *     summary: Get a cat by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the cat
 *     responses:
 *       200:
 *         description: Success
 */
app.get('/getCat/:id', (req, res) => {
  const id = req.params.id;
  CatModel.findById(id)
    .then((cat) => res.json(cat))
    .catch((err) => res.json(err));
});

/**
 * @openapi
 * /createCat:
 *   post:
 *     summary: Create a new cat
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cat'
 *     responses:
 *       201:
 *         description: Success
 */
app.post('/createCat', upload.single('image'), (req, res) => {
  const { name, gender, age, breed } = req.body;
  const image = req.file ? req.file.filename : null;
  const newCat = new CatModel({ name, gender, age, breed, image });

  newCat
    .save()
    .then(() => {

      res.status(201).json('Cat created successfully');
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

/**
 * @openapi
 * /updateCat/{id}:
 *   put:
 *     summary: Update an existing cat
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the cat
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cat'
 *     responses:
 *       200:
 *         description: Success
 */
app.put('/updateCat/:id', upload.single('image'), async (req, res) => {
  const id = req.params.id;
  const { name, gender, age, breed } = req.body;
  const image = req.file ? req.file.filename : null;

  CatModel.findByIdAndUpdate(id, { name, gender, age, breed, image })
    .then(() => {
      res.json('Cat updated successfully');
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});




/**
 * @openapi
 * /deleteCat/{id}:
 *   delete:
 *     summary: Delete a cat
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the cat
 *     responses:
 *       200:
 *         description: Success
 */
app.delete('/deleteCat/:id', (req, res) => {
  const id = req.params.id;
  CatModel.findByIdAndDelete(id)
    .then((cat) => res.json(cat))
    .catch((err) => res.json(err));
});

// Users API

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Success
 */
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        res.status(500).json({ error: 'Failed to register user' });
      } else {
        const user = new UserModel({ username, password: hashedPassword, userStatus: 1 });
        user
          .save()
          .then(() => res.json({ success: true }))
          .catch(() => res.status(500).json({ error: 'Failed to register user' }));
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Log in with username and password
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Success
 */
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username });

    if (!user) {
      return res.json({ success: false });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const userStatus = user.userStatus;
        return res.json({ success: true, token: 'YOUR_AUTH_TOKEN', userStatus });
      } else {
        return res.json({ success: false });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

/**
 * @openapi
 * /sendMessage:
 *   post:
 *     summary: Send a message
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               sender:
 *                 type: string
 *               recipient:
 *                 type: string
 *               message:
 *                 type: string
 *             required:
 *               - sender
 *               - recipient
 *               - message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       500:
 *         description: Internal server error
 */
app.post('/sendMessage', (req, res) => {
  const { sender, message } = req.body;

  const newMessage = new MessageModel({ sender, message });
  newMessage
    .save()
    .then(() => {
      res.status(201).json('Message sent successfully');
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

/**
 * @openapi
 * /deleteMessage/{id}:
 *   delete:
 *     summary: Delete a message
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the message
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       500:
 *         description: Internal server error
 */
app.delete('/deleteMessage/:id', (req, res) => {
  const id = req.params.id;
  MessageModel.findByIdAndDelete(id)
    .then(() => {
      res.json('Message deleted successfully');
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

/**
 * @openapi
 * /respondToMessage/{id}:
 *   put:
 *     summary: Respond to a message
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the message
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               response:
 *                 type: string
 *             required:
 *               - response
 *     responses:
 *       200:
 *         description: Message responded successfully
 *       500:
 *         description: Internal server error
 */
app.put('/respondToMessage/:id', (req, res) => {
  const id = req.params.id;
  const { recipient, response } = req.body;

  MessageModel.findByIdAndUpdate(id, { recipient, response })
    .then(() => {
      res.json('Message responded successfully');
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

/**
 * @openapi
 * /getAllMessages:
 *   get:
 *     summary: Get all messages
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: Internal server error
 */
app.get('/getAllMessages', (req, res) => {
  MessageModel.find()
    .then((messages) => {
      res.json(messages);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

/**
 * @openapi
 * /getMessages/{id}:
 *   get:
 *     summary: Get messages by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the message
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
app.get('/getMessages/:id', (req, res) => {
  const id = req.params.id;
  MessageModel.findById(id)
    .then((messages) => res.json(messages))
    .catch((err) => res.json(err));
});



app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(3002, () => {
  console.log('Server running on port 3002');
});



