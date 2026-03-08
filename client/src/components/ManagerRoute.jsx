import {useLocation, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ManagerRoute({children}) {
    const location = useLocation();
    const {userProfile,loading} = useAuth();
    if(loading || !userProfile) return <h1>Loading...</h1>
    return userProfile?.role === "Manager" ? children : <Navigate to="/dashboard" state={{ from: location.pathname }} />

}