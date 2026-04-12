import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
import { db } from "../firebase"

export default function CreatePost({ docID }) {
    const nav = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({ title: "", body: "" });
    const [originalData, setOriginalData] = useState({ title: "", body: "" });
    const isEditing = !!docID;

    useEffect(() => {
        if (!isEditing) return;
        const findDocument = async () => {
            const snapShot = await getDoc(doc(db, "news", docID));
            if (snapShot.exists()) {
                const data = snapShot.data();
                setFormData(data);
                setOriginalData(data);
            }
            else{
                    nav("/not-found");
                    return;
                }

        }
        findDocument();
    }, [docID]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handlePublish = async () => {
        if (isEditing) {
            await updateDoc(doc(db, "news", docID), {
                title: formData.title,
                body: formData.body
            });
        }
        else {
            await addDoc(collection(db, "news"), {
                title: formData.title,
                body: formData.body,
                authorName: currentUser.displayName,
                publishedAt: serverTimestamp()
            });
        }

        nav("/news");
    }

    const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{isEditing ? "Edit Post" : "Create News Post"}</h1>

            <form className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter post title"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Content</label>
                    <textarea
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        placeholder="Write your post content here..."
                        rows="12"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 resize-none" style={{ "--tw-ring-color": "#FF6B00" }}
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handlePublish}
                        className="btn-primary"
                        disabled={!formData.title || !formData.body}
                    >
                        {isEditing ? "Update Post" : "Publish Post"}
                    </button>
                    <button
                        type="button"
                        onClick={() => nav("/news")}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )



}