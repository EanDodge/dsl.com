import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { createContext, useContext, useState, useEffect } from "react";


export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // 2. useEffect with onAuthStateChanged
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setLoading(false);
            setCurrentUser(user);
        });
        return unsubscribe;
    }, []);

    // 3. return the Provider with the user value
    return (
        <AuthContext.Provider value={{currentUser, loading}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}