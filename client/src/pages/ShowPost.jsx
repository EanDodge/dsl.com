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

        }
        findDocument();
    }, [docID]);

    return (
        <div>
            <h2>{formData.title}</h2>
            <h3>{formData.authorName}</h3>
            <h3>{formData.publishedAt?.toDate().toLocaleDateString()}</h3>
            <p>{formData.body}</p>

            {userProfile?.role === "Manager" &&
                <Link to={`/news/edit/${docID}`}>Edit</Link>
            }
        </div>

    )



}