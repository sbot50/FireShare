import express from 'express';
const app = express();
const port = process.env.PORT;

app.use("/", express.static("home"));
app.use("/client", express.static("client"));

app.use("/res", express.static("res"));

app.listen(port, () => {
    console.log(`SITENAME is listening at http://localhost:${port}`);
});
