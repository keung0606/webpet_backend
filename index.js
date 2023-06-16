const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemon = require('nodemon');
const CatModel = require('./models/Cats');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(
    "mongodb+srv://keung123:keung123@cluster0.bgogxcp.mongodb.net/petweb_db?retryWrites=true&w=majority"
);

app.get("/", (req, res) => {
  CatModel.find({})
    .then(cats => res.json(cats))
    .catch(err => res.json(err))
})

app.get('/getCat/:id', (req, res) => {
  const id = req.params.id;
  CatModel.findById(id)
    .then(cat => res.json(cat))
    .catch(err => res.json(err))
})

app.post("/createCat", (req, res) => {
  CatModel.create(req.body)
    .then(cat => res.json(cat))
    .catch(err => res.json(err))
})

app.put("/updateCat/:id", (req, res) => {
  const id = req.params.id;
  CatModel.findByIdAndUpdate(id, req.body)
    .then(cat => res.json(cat))
    .catch(err => res.json(err))
})

app.delete("/deleteCat/:id", (req, res) => {
  const id = req.params.id;
  CatModel.findByIdAndDelete(id)
    .then(result => res.json(result))
    .catch(err => res.json(err))
})


app.listen(3002, () => {
    console.log("Server start");
})