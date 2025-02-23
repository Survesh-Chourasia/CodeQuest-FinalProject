import express, { response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { exec } from 'child_process';
import fs from "fs";
import { error } from "console";
import { stdout } from "process";
import pg from "pg";

const db = new pg.Client({
    user: "postgres",
    password: "Nikhil",
    database: "CodeGames",
    host: "localhost",
    port: 5432
})

db.connect();

const app = express();
const port = 5000;



app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use(bodyParser.json());

app.post('/compile', (req, res) => {
    const code = req.body.datatoSend.code;
    const input = req.body.datatoSend.input;

    // const {code,input}=req.body.datatoSend;
    console.log(code);
    console.log(input);


    fs.writeFileSync('index.c', code);


    exec(' gcc index.c -o code', (error, stdout, stderr) => {
        if (error) {
            return res.json({ output: stderr });
        }
        exec(` echo ${input} | code.exe`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ output: stderr });
            }
            res.json({ output: stdout });
        });
    });


});


app.post('/login', async (req, res) => {
    let user = req.body.data.user;
    let pass = req.body.data.pass;


    try {
        const result = await db.query("SELECT * FROM userid WHERE username = $1", [user]);
        const data = result.rows[0];

        // if (data.password === pass) {
        //     res.json("success");
        //     console.log("Redirecting");
        // } else {
        //     res.json("notsuccess");
        // }

        if (data === undefined) {
            res.json("notsuccess");
            console.log("Not Sucees");
        } else if (data.password === pass) {
            res.json("success");
        } else if (data.password !== pass) {
            res.json("notsuccess");
        }
        else {
            res.json("error");
        }
    } catch (err) {
        res.json("notsuccess");
    }
});

app.post("/register", async (req, res) => {
    let user = req.body.data.user;
    let pass = req.body.data.pass;

    try {
        const result = await db.query("SELECT * FROM userid WHERE username = $1", [user]);
        const data = result.rows[0];
        console.log(data);
        if (result.rows.length === 0) {
            const result = await db.query("INSERT INTO userid (username,password) VALUES($1,$2)", [user, pass]);
            if (result) {
                console.log("Done");
                res.json("Done");
            } else {
                res.json("Error");
            }
        } else {
            res.json("Already");
        }
    } catch (err) {
        res.json("Already");
    }
});

app.post("/profile", async (req, res) => {
    const username = req.body.data;
    console.log(username, "Profile Fetching");
    const result = await db.query("SELECT * FROM profile WHERE username = $1", [username]);

    const data = result.rows[0];
    console.log(data)
    if (data === undefined) {
        res.json("No Date");
    } else {
        res.json(data);
    }
})

app.post("/setprofile", async (req, res) => {
    const data = req.body.profileData;
    console.log(data, "Data")
    const username = data.username;
    const fullname = data.fullName;
    const age = data.age;
    const gender = data.gender;
    const mail = data.mail;
    const coder = data.coder;
    const avatar = data.avatar;
    const bio = data.bio;

    try {
        const result = await db.query("INSERT INTO profile(username,fullname,age,gender,mail,coder,avatar,bio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [username, fullname, age, gender, mail, coder, avatar, bio]);
        if (result) {
            console.log("Added");
            res.json("Added");
        } else {
            res.json("Error");
        }
    } catch (err) {
        res.json("Error");
    }
})

app.post("/points", async (req, res) => {
    const user = req.body.data;
    const result = await db.query("SELECT * FROM points WHERE username =($1)", [user]);
    console.log(result.rows[0], "points");
    const data = result.rows[0];

    try {
        if (result.rows.length === 0) {
            const result = await db.query("INSERT INTO points (username ,lives,coins) VALUES($1,$2,$3)", [user, 100, 100]);
            console.log(result);
        } else {
            res.json(data);
        }
    } catch (err) {
        res.json("Error");
    }
});

app.post("/rank", async (req, res) => {
    const result = await db.query("SELECT fullname,  coins,  ROW_NUMBER() OVER (ORDER BY coins DESC) AS rank FROM  points  INNER JOIN   profile  ON points.username = profile.username ORDER BY  coins DESC");
    const data = result.rows;

    // data.map((d) => { console.log(d, "data") });
    console.log(result.rows);
    res.json(result.rows);
});

app.post("/levels", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM level WHERE username = $1", [req.body.data]);
        if (result.rows.length === 0) {
            await db.query("INSERT INTO level(username,levels,tab) VALUES ($1,$2,$3)", [req.body.data, "one", 0]);
            res.json("Success");
        }
        // console.log(result.rows[0]);
        // res.json(result.rows[0]);
        const data = result.rows[0];
        res.json(data);
    } catch (err) {
        res.json("Error");
    }
});

app.post("/nextPage", async (req, res) => {
    const data = req.body.nextTabs;
    const user = req.body.user;
    const response = await db.query("UPDATE level SET tab = ($1) WHERE usename = ($2) ", [data, user])
    if (response) {
        console.log("Dione");
        res.json("Success");
    } else {
        res.json("Unsuccess");
    }

});

app.post("/addP", async (req, res) => {
    const { username, coins } = req.body;
    console.log(username, coins);
    await db.query("UPDATE points SET coins = $1 WHERE username = $2", [coins, username]).then((response) => {
        res.json("Done");
    }).catch((err) => {
        res.json("Error");
    });
});


app.post("/cutL", async (req, res) => {
    const { username, lives } = req.body;

    await db.query("UPDATE points SET lives = $1 WHERE username = $2", [lives, username]).then((response) => {
        res.json("Done");
    }).catch((err) => {
        res.json("Error");
    });
})

app.get('/', (req, res) => {


    console.log("Hello");
    res.send("Heloo");

});




app.listen(port, (req, res) => { console.log(`Listening on ${port}`) })