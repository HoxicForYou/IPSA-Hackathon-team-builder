import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

// TODO: Replace the following with your app's Firebase project configuration.
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyCUOXnxz1_rWvcAVBXtmV-BCRp4dUwexUc",
  authDomain: "ipsa-sih-team-builder.firebaseapp.com",
  databaseURL: "https://ipsa-sih-team-builder-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "ipsa-sih-team-builder",
  storageBucket: "ipsa-sih-team-builder.appspot.com",
  messagingSenderId: "1057121653857",
  appId: "1:1057121653857:web:8c5b0451cae489582782b1"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.database();

export default firebase;
