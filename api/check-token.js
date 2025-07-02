import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!global.firebaseApp) {
  global.firebaseApp = initializeApp({ credential: cert(serviceAccount) });
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    await getAuth().verifyIdToken(token);
    return res.status(200).json({ valid: true });
  } catch {
    return res.status(401).json({ valid: false });
  }
}
