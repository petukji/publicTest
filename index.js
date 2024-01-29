const express =require('express');
const app=express();
app.use(express.json());


app.post('/Frenzo', async (req, res) => {
    try {
        const {
            country,
            action
        } = req.body;
        return res.json("Subhash Rana");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error/Invalid Input' });
    }
});