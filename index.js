const express = require('express')
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const cors = require('cors');
app.use(cors({ origin: true }))


app.post('/temp', async (req, res) => {
    try {
        const { var1, var2 } = req.body;
        const result = var1 + var2;
        res.json({ result });
    } catch (error) {
        console.error(error);
         res.status(500).json({ error: 'Internal Server Error/Invalid Input' });
    }
});
app.get("/", (req, res) => {
    res.send("Hello World!");
  });