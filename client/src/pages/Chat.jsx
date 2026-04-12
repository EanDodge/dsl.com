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
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden pt-16 pb-20 md:pb-0">
            {/* Messages area */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
            >
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className={`flex ${message.senderUid === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs ${message.senderUid === currentUser?.uid ? 'bg-[#008E97] text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2`}>
                                    {message.senderUid !== currentUser?.uid && (
                                        <p className="text-xs font-semibold text-gray-600 mb-1">{message.senderName}</p>
                                    )}
                                    <p className="text-sm break-words">{message.text}</p>
                                    <p className={`text-xs mt-1 ${message.senderUid === currentUser?.uid ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input area */}
            <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 max-w-full">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows="1"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 resize-none" style={{ "--tw-ring-color": "#FF6B00" }}
                    />
                    <button
                        onClick={handleSend}
                        className="px-4 py-2 bg-[#008E97] text-white rounded-lg hover:opacity-90 font-semibold transition-opacity"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}