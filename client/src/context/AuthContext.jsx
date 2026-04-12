import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore"
import { auth, db } from "../firebase";
import { createContext, useContext, useState, useEffect } from "react";


export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setuserProfile] = useState(null);
    // 2. useEffect with onAuthStateChanged
    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setLoading(false);

            if (user) {
                unsubscribeProfile = onSnapshot(
                    doc(db, "users", user.uid),
                    (snap) => {
                        if (snap.exists()) setuserProfile(snap.data());
                        else setuserProfile(null);
                    },
                    (error) => {
                        // Ignore permission errors during auth transition
                        if (error.code !== 'permission-denied') {
                            console.error("Profile snapshot error:", error);
                        }
                    }
                );

                const userSnap = await getDoc(doc(db, "users", user.uid));
                if (!userSnap.exists()) {
                    const newProfile = {
                        uid: user.uid,
                        displayName: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        bio: "",
                        createdAt: serverTimestamp(),
                        role: "Player",
                        leagueIds: []
                    };
                    await setDoc(doc(db, "users", user.uid), newProfile);
                }
            } else {
                setuserProfile(null);
                if (unsubscribeProfile) unsubscribeProfile();
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
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