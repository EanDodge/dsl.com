import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"

export default function ShowPost({ docID }) {
    const { userProfile } = useAuth();
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const findDocument = async () => {
            const snapShot = await getDoc(doc(db, "news", docID));
            if (snapShot.exists()) {
                setFormData(snapShot.data());
            }
            else{
                    // nav("/not-found");
                    return;
                }

        }
        findDocument();
    }, [docID]);

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-3xl mx-auto">
            <article className="prose prose-lg max-w-none">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{formData.title}</h1>
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                    <div>
                        <p className="text-sm text-gray-600">By <span className="font-medium text-gray-900">{formData.authorName}</span></p>
                        <p className="text-sm text-gray-500">{formData.publishedAt?.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8">
                    {formData.body?.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>

                {userProfile?.role === "Manager" && (
                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                        <Link to={`/news/edit/${docID}`} className="btn-primary">
                            Edit Post
                        </Link>
                        <Link to="/news" className="btn-secondary">
                            Back to News
                        </Link>
                    </div>
                )}
            </article>
        </div>

    )



}