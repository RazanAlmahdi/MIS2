const msal = require('@azure/msal-node');
const msalConfig = require('./authConfig');
const jwt = require('jsonwebtoken'); // simple JWT decode/verify
const jwksClient = require('jwks-rsa');

// Create MSAL confidential client if needed
const cca = new msal.ConfidentialClientApplication(msalConfig);

// JWKS client for token verification
const client = jwksClient({
    jwksUri: `https://login.microsoftonline.com/YOUR_TENANT_ID/discovery/v2.0/keys`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

async function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
            audience: msalConfig.auth.clientId,
            issuer: `https://sts.windows.net/YOUR_TENANT_ID/`
        }, (err, decoded) => {
            if (err) resolve(false);
            else resolve(true);
        });
    });
}

module.exports = { verifyToken };
