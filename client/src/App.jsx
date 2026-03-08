import { Routes, Route, Navigate, Link } from "react-router-dom"
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoute"
import Profile from "./pages/Profile"
import Navbar from "./components/Navbar"
import About from "./pages/About"
import News from "./pages/News"
import ManagerRoute from "./components/ManagerRoute"
import CreatePost from "./pages/CreatePost"
import EditPost from "./pages/EditPost"
import GetPost from "./pages/GetPost"
import CreateLeague from "./pages/CreateLeague"
import { useAuth } from "./context/AuthContext"
import { apiGet, apiPost } from "./api"

export default function App() {
  const {currentUser} = useAuth();
  const handleclick = async () =>
  {
    const token = await currentUser.getIdToken();
    const result = await apiGet("/health", token);
    console.log(result);
  }
  const handleTest = async () => {
    const token = await currentUser.getIdToken();
    const result = await apiPost("/api/leagues", {}, token);
    console.log(result);
}
const handleTestLeague = async () => {
    const token = await currentUser.getIdToken();
    const result = await apiPost("/api/leagues", {
        name: "DodgeSports",
        sport: "football",
        location: {
            city: "Akron",
            state: "Ohio"
        }
    }, token);
    console.log(result);
}
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <h1>Dashboard — coming soon</h1> 
            <button onClick = {handleclick}>Click Me</button>     
            <button onClick = {handleTest}>API Call</button>   
            {/* <button onClick = {handleTestLeague}>Make League</button>    */}
            <Link to="/league/create">Create Your Own League</Link>
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
            <ManagerRoute>
              <CreatePost />
            </ManagerRoute>
          </ProtectedRoute>
        } />
        <Route path="/news/edit/:postId" element={
          <ProtectedRoute>
            <ManagerRoute>
              <EditPost />
            </ManagerRoute>
          </ProtectedRoute>
        } />
        <Route path="/news/post/:postId" element={<GetPost />
        } />
        <Route path="/league/create" element = {
          <ProtectedRoute>
            <CreateLeague />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}