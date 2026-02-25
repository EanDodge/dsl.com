import {Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import { useAuth } from "./Context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import SignOut from "./pages/Signout"

export default function App() {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <h1>Dashboard — coming soon</h1>
            <SignOut />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
  )
}