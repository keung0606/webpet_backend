const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const CatModel = require('./models/Cats');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
const UserModel = require('./models/Users');
const bcrypt = require('bcrypt');


const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/petweb_db");

// Define Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cat API',
      version: '1.0.0',
      description: 'API endpoints for managing cats'
    },
    components: {
      schemas: {
        Cat: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            breed: { type: 'string' },
          },
          required: ['name', 'age', 'breed'],
        },
        User: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
          required: ['username', 'password'],
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
app.get("/", (req, res) => {
  CatModel.find({})
    .then(cats => res.json(cats))
    .catch(err => res.json(err))
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
    .then(cat => res.json(cat))
    .catch(err => res.json(err))
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
 *       200:
 *         description: Success
 */
app.post("/createCat", (req, res) => {
  CatModel.create(req.body)
    .then(cat => res.json(cat))
    .catch(err => res.json(err))
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
app.put("/updateCat/:id", (req, res) => {
  const id = req.params.id;
  CatModel.findByIdAndUpdate(id, req.body, { new: true })
    .then(cat => res.json(cat))
    .catch(err => res.json(err))
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
app.delete("/deleteCat/:id", (req, res) => {
  const id = req.params.id;
  CatModel.findByIdAndDelete(id)
    .then(cat => res.json(cat))
    .catch(err => res.json(err))
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
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      res.status(500).json({ error: 'Failed to register user' });
    } else {
      UserModel.create({ username, password: hashedPassword })
        .then((user) => res.json(user))
        .catch((err) => res.status(500).json({ error: 'Failed to register user' }));
    }
  });
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
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  UserModel.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.json({ success: false });
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          // Generate and send a token for authentication if needed
          return res.json({ success: true, token: 'YOUR_AUTH_TOKEN' });
        } else {
          return res.json({ success: false });
        }
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false });
    });
});




// Start the server
app.listen(3002, () => {
  console.log('Server running on port 3002');
});

