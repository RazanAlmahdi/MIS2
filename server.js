
const express = require("express");
const path = require("path");
const msal = require("@azure/msal-node");
const msalConfig = require("./authConfig");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// MSAL Client
const cca = new msal.ConfidentialClientApplication(msalConfig);

// Redirect URI route
app.get("/redirect", async (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"], // basic profile info
        redirectUri: "http://localhost:3000/redirect"
    };

    try {
        const response = await cca.acquireTokenByCode(tokenRequest);
        console.log("Access Token:", response.accessToken);
        res.send("Logged in! You can now use the access token to access company APIs.");
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Login route
app.get("/login", (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect"
    };

    cca.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            res.redirect(response);
        })
        .catch((error) => console.log(JSON.stringify(error)));
});

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
