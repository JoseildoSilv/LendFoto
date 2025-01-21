const firebaseConfig = {
    // Substitua com suas credenciais do Firebase
    apiKey: "sua-api-key",
    authDomain: "seu-auth-domain",
    projectId: "seu-project-id",
    storageBucket: "seu-storage-bucket",
    messagingSenderId: "seu-sender-id",
    appId: "seu-app-id"
  };
  
  firebase.initializeApp(firebaseConfig);
  
  const storage = firebase.storage();
  const db = firebase.firestore();