const express = require("express");
const crypto = require("crypto");
const querystring = require("querystring");
const config = require("config");
const db = require("db");
const Fetch = require("fetch");

let router = express.Router();
module.exports = router;

async function generateToken(client) {
    do {
        let token = crypto.randomBytes(64).toString('hex');
        
        //Ensure this token doesn't exist
        let rows = await client.query("SELECT * FROM webTokens WHERE token=$1", [token]);
        if (rows.rowCount == 0) return token;
    } while (true);
}

router.post("/login", async function(req, res) {
    if (!req.body.code) {
        res.status(400).send();
        return;
    } else {
        //Attempt to log into Discord
        
        try {
            let result = await Fetch.reqRaw("https://discordapp.com/api/oauth2/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: querystring.stringify({
                    client_id: config.get("discord.client_id"),
                    client_secret: config.get("discord.client_secret"),
                    grant_type: "authorization_code",
                    code: req.body.code,
                    redirect_uri: `${config.get("server.rootAddress")}/popupCallback.html`,
                    scope: "identify guilds"
                })
            });
            result = await result.json();
            
            if (result.error) {
                console.log(result);
                res.status(500).send();
            }
            
            let client = await db.get();
            
            //Generate a token for the user
            let tok = await generateToken(client);
            await client.query("INSERT INTO webTokens(token, refreshToken, accessToken) VALUES($1, $2, $3)", [
                tok, result.refresh_token, result.access_token
            ]);
            client.release();
            
            res.status(200).send({
                status: "success",
                token: tok
            });
        } catch (err) {
            res.status(500).send();
        }
    }
});

router.get("/me", async function(req, res) {
    if (!req.user) {
        res.status(401).send();
    } else {
        try {
            //Get guilds and user information from Discord
            let user = await Fetch.req(req.user, "/users/@me", {
                method: "GET"
            });
                    
            let guilds = await Fetch.req(req.user, "/users/@me/guilds", {
                method: "GET"
            });

			if (user.avatar) {
				user.avatarurl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?height=256`;
			} else {
				user.avatarurl = `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
			}
            
            res.status(200).send({
                user: user,
                guilds: guilds
            });
        } catch (err) {
            if (err.message === "Unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).send();
            }
        }
    }
});
