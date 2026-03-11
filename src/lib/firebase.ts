import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Estas configurações devem ser obtidas no Console do Firebase
// Recomenda-se usar variáveis de ambiente para produção
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);