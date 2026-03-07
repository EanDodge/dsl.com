import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"

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
        <div>
            <h1>Dodge Sports League News</h1>
            {posts.map((post) => (
                <div key={post.id}>
                    <h2>{post.title}</h2>
                    <h3>{post.authorName}</h3>
                    <h3>{post.publishedAt?.toDate().toLocaleDateString()}</h3>
                    {userProfile?.role === "Commissioner" &&
                        <Link to={`/news/edit/${post.id}`}>Edit</Link>
                    }
                    <Link to={`/news/post/${post.id}`}>Show More</Link>
                </div>))}
        </div>
    )
}