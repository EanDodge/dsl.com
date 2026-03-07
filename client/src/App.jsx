import { Routes, Route, Navigate, Link } from "react-router-dom"
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoute"
import Profile from "./pages/Profile"
import Navbar from "./components/Navbar"
import About from "./pages/About"
import News from "./pages/News"
import CommishRoute from "./components/CommishRoute"
import CreatePost from "./pages/CreatePost"
import EditPost from "./pages/EditPost"
import GetPost from "./pages/GetPost"
export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <h1>Dashboard — coming soon</h1>
            <Link to="/profile">Account</Link>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Link to="/dashboard">Back To Dashboard</Link>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/create" element={
          <ProtectedRoute>
            <CommishRoute>
              <CreatePost />
            </CommishRoute>
          </ProtectedRoute>
        } />
        <Route path="/news/edit/:postId" element={
          <ProtectedRoute>
            <CommishRoute>
              <EditPost />
            </CommishRoute>
          </ProtectedRoute>
        } />
        <Route path="/news/post/:postId" element={<GetPost />
        } />
      </Routes>
    </>
  )
}