import {useLocation, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({children}) {
    const location = useLocation();
    const {currentUser, loading} = useAuth();
    if(loading) return <h1>Loading...</h1>
    return currentUser ? children : <Navigate to="/login" state={{ from: location.pathname }} />

}