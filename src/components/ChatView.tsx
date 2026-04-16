import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export function ChatView({ userId, onBack, t }: { userId: string, onBack: () => void, t: (key: string) => string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const q = query(collection(db, 'users', userId, 'chat'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'users', userId, 'chat'), {
      text: newMessage,
      senderId: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-white p-4">
      <button onClick={onBack} className="mb-4 text-primary font-bold">← {t("Back")}</button>
      <div className="flex-grow overflow-y-auto space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`p-2 rounded-lg ${msg.senderId === auth.currentUser?.uid ? 'bg-primary text-white self-end' : 'bg-gray-200 self-start'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-grow border p-2 rounded" placeholder={t("Type a message...")} />
        <button onClick={sendMessage} className="bg-primary text-white px-4 py-2 rounded">{t("Send")}</button>
      </div>
    </div>
  );
}
