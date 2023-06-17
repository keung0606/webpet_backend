const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const CatModel = require('./models/Cats');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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




// Start the server
app.listen(3002, () => {
  console.log('Server running on port 3002');
});
