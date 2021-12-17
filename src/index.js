require('dotenv').config({ path: "./config.env" })
const { query } = require('express')
const express = require("express")
const mongoose = require('mongoose')
const app = express()

mongoose.connect(process.env.URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err) => {
        if (err) console.log(err);
        console.log("connected to mongodb");
    })
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


const userSchema = new mongoose.Schema({
    "id": Number,
    "first_name": String,
    "last_name": String,
    "company_name": String,
    "city": String,
    "state": String,
    "zip": Number,
    "email": String,
    "web": String,
    "age": Number
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    }
})
const User = mongoose.model("user", userSchema)

app.get("/", (req, res) => {
    res.send("<h2>Hello and welcome to users api. Type /users in url to get users</h1>")
})
app.route("/users")
    .get((req, res) => {
        console.log("query received", req.query);
        var { page: pag, limit: lim, name: nm, sort: sortname } = req.query
        var sid = 1
        if (pag === undefined) {
            pag = 1
        }
        if (lim === undefined || lim <= 0) {
            lim = 5
        }
        if (sortname === undefined) {
            sortname = "id"
        }
        else if (sortname.charAt(0) === '-') {
            sid = -1
            sortname = sortname.substring(1)
        }
        console.log(pag, lim, sid);

        if (nm === undefined)
            User.find({})
                .sort({ [sortname]: sid })
                .skip((pag > 0) ? ((pag - 1) * lim) : 0)
                .limit(parseInt(lim)).then((userArr) => {
                    res.status(200).json(userArr)
                    res.end()
                })
        else
            User.find({ $or: [{ first_name: { $regex: nm, $options: 'i' } }, { last_name: { $regex: nm, $options: 'i' } }] })
                .sort({ [sortname]: sid })
                .skip((pag > 0) ? ((pag - 1) * lim) : 0)
                .limit(lim).then((userArr) => {
                    res.status(200).json(userArr)
                    res.end()
                })
    })
    .post((req, res) => {
        const new_user = new User({
            id: req.body.id,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            company_name: req.body.company_name,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            email: req.body.email,
            web: req.body.web,
            age: req.body.age
        })
        new_user.save((err, foundUser) => {
            if (err) console.log(err);
            res.status(201).send({})
        })
    }).delete((req, res) => {
        User.deleteMany({}, (err, result) => {
            if (err) console.log(err);
            else
                res.send("true")
            console.log(result);
        })
    })

app.route("/users/:id")
    .get((req, res) => {
        const uid = req.params.id
        User.findOne({ id: uid }, (err, foundUser) => {
            if (err) console.log(err);
            else
                res.status(200).json(foundUser)
        })
    })
    .put((req, res) => {
        const { first_name: fName, last_name: lName, age: ag } = req.body
        console.log("inside put", req.body);
        if (fName && lName && ag)
            User.findOneAndUpdate({ id: req.params.id },
                {
                    $set: {
                        first_name: fName,
                        last_name: lName,
                        age: ag
                    }
                }, (err, result) => {
                    if (err) console.log(err);
                    else
                        console.log(result);
                    res.status(200).send({})
                })
    })
    .delete((req, res) => {
        if (req.params.id)
            User.findOneAndDelete({ id: req.params.id }, (err, result) => {
                if (err) console.log(err);
                console.log(result);
                res.status(200).send({})
            })
    })

const port = (process.env.PORT || 3000)

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})