const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.database();

exports.api = onRequest({ region: "europe-west1" }, (req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method === 'GET') {
                const snapshot = await db.ref('submissions_public').get();
                res.status(200).json(snapshot.val() || {});
            } else if (req.method === 'POST') {
                const { data, name } = req.body;
                
                // Add public entry
                const publicRef = db.ref('submissions_public');
                const newSubmissionRef = publicRef.push();
                await newSubmissionRef.set(data);
                
                // Add private entry securely
                const privateRef = db.ref(`submissions_private/${newSubmissionRef.key}`);
                await privateRef.set({ name: name });
                
                res.status(200).json({ name: newSubmissionRef.key });
            } else {
                res.status(405).send('Method Not Allowed');
            }
        } catch (error) {
            console.error("API Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});

exports.settings = onRequest({ region: "europe-west1" }, (req, res) => {
    cors(req, res, async () => {
        try {
            const snapshot = await db.ref('settings').get();
            res.status(200).json(snapshot.val() || {});
        } catch (error) {
            console.error("Settings API Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});
