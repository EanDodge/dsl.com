import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../firebase";
import { createContext, useContext, useState, useEffect } from "react";


export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setuserProfile] = useState(null);
    // 2. useEffect with onAuthStateChanged
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(false);
            setCurrentUser(user);
            if (user) {
                const userSnap = await getDoc(doc(db, "users", user.uid));
                if (!userSnap.exists()) {
                    const newProfile = {
                        displayName: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        bio: "",
                        createdAt: serverTimestamp(),
                        role: "Player"
                    };
                    await setDoc(doc(db, "users", user.uid), newProfile);
                    setuserProfile(newProfile);
                } else {
                    setuserProfile(userSnap.data());
                }
            } else setuserProfile(null);

        });
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, loading, userProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}