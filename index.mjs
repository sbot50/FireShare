import express from 'express';
const app = express();
const port = process.env.PORT;

app.get('/', (req, res) => {
    res.redirect("/client");
});

app.use("/client", express.static("client"));
app.use("/host", express.static("host"));
app.use("/share", express.static("share"));

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
