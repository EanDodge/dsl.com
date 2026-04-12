import { Link } from "react-router-dom"

export default function NotFound() {
    return (
        <div>
            <h1>404 — Page Not Found</h1>
            <p>That page doesn't exist or you don't have access to it.</p>
            <Link to="/dashboard">Go back to Dashboard</Link>
        </div>
    )
}