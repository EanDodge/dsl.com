import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"
import PageCard from "../components/PageCard"

export default function News() {
    const [posts, setPosts] = useState([]);
    useEffect(() => {
        const getTheNews = async () => {
            const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
            const snapShot = await getDocs(q);
            if (snapShot) {
                setPosts(snapShot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            }
        }
        getTheNews();
    }, []);
    const { userProfile } = useAuth()
    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Dodge Sports League News</h1>
                <p className="text-gray-500">Stay updated on league announcements and highlights</p>
            </div>

            {posts.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No news yet</p>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Link key={post.id} to={`/news/post/${post.id}`}>
                            <PageCard accentColor="orange" className="cursor-pointer hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 transition-colors" style={{ "--tw-text-opacity": "1" }} onMouseEnter={(e) => e.target.style.color = "#FF6B00"} onMouseLeave={(e) => e.target.style.color = "inherit"}>
                                            {post.title}
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-3">
                                            By {post.authorName} • {post.publishedAt?.toDate().toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {post.body?.substring(0, 150)}...
                                        </p>
                                    </div>
                                    {userProfile?.role === "Manager" && (
                                        <Link
                                            to={`/news/edit/${post.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs font-medium hover:underline flex-shrink-0 whitespace-nowrap" style={{ color: "#FF6B00" }}
                                        >
                                            Edit
                                        </Link>
                                    )}
                                </div>
                            </PageCard>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}