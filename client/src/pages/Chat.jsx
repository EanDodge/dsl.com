import { useState, useEffect, useRef } from "react"
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Chat() {
    const { leagueId } = useParams();
    const { currentUser, userProfile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const bottomRef = useRef(null);

    useEffect(() => {
        const q = query(
            collection(db, "leagues", leagueId, "chat"),
            orderBy("timestamp", "asc"),
            limit(50)
        );
        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        );
        return unsubscribe;
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 3. send a message
    const handleSend = async () => {
        if (newMessage.trim().length > 0) {
            const message = {
                senderUid: userProfile?.uid,
                senderName: userProfile?.displayName,
                text: newMessage,
                timestamp: serverTimestamp(),
                type: "text"
            }
            await addDoc(collection(db, "leagues", leagueId, "chat"), message);
            setNewMessage("");
        }
    }


    // 4. send on Enter key
    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSend();
    }

    return (
        <div>
            <h1>League Chat</h1>

            {messages.map((message) => (
                <div key={message.id}>
                    <h3>{message.senderName}</h3>
                    <p>{message.text}</p>
                    <small>{message.timestamp?.toDate().toLocaleDateString()}</small>
                </div>
            ))}
            <textarea placeholder="New Message" value={newMessage} onKeyDown={handleKeyDown} onChange={(e) => setNewMessage(e.target.value)} />
            <button onClick={handleSend}>{'>'}</button>
            <div ref={bottomRef} />
        </div>
    )
}