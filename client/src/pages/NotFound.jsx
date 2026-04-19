import { Link } from "react-router-dom"

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen pt-safe px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-2xl text-gray-600 mb-6">Page Not Found</p>
                <p className="text-gray-500 mb-8">That page doesn't exist or you don't have access to it.</p>
                <Link to="/dashboard" className="btn-primary inline-block">
                    Go back to Dashboard
                </Link>
            </div>
        </div>
    )
}