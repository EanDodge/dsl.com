import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
import { db } from "../firebase"

export default function CreatePost({ docID }) {
    const nav = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({ title: "", body: "" });
    const isEditing = !!docID;
    useEffect(() => {
        if (!isEditing) return;
        const findDocument = async () => {
            const snapShot = await getDoc(doc(db, "news", docID));
            if (snapShot.exists()) {
                setFormData(snapShot.data());
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
    return (
        <div>
            <div>
                <h1>Title</h1>
                <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                /></div>
            <div>
                <textarea
                    name="body"
                    value={formData.body}
                    onChange={handleChange} />
            </div>
            <button onClick={handlePublish}>Save</button>
        </div>

    )



}