// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyBR1LBADsOiuu8jBsD3hSSRG4BAOK2PIhg",

  authDomain: "dodgesportsleague-bf498.firebaseapp.com",

  projectId: "dodgesportsleague-bf498",

  storageBucket: "dodgesportsleague-bf498.firebasestorage.app",

  messagingSenderId: "122034246276",

  appId: "1:122034246276:web:7eb3edb51e884f11b7a8d1",

  measurementId: "G-JF37RCWPWM"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);