import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef  = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // In dev, connect through the Vite proxy (empty URL = same origin).
    // In production, connect to the deployed backend (VITE_API_URL).
    const socket = io(import.meta.env.VITE_API_URL || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id);
    });

    socket.on('scan:complete', (data) => {
      const notif = { id: Date.now(), ...data, seen: false };
      setNotifications((prev) => [notif, ...prev].slice(0, 30));
      setUnread((n) => n + 1);

      if (data.emergency) {
        toast.error(data.message, { duration: 10000, icon: '🚨' });
      } else {
        toast.success(data.message, { duration: 5000 });
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const clearUnread = () => setUnread(0);

  const markAllSeen = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
    setUnread(0);
  };

  return (
    <SocketContext.Provider value={{ notifications, unread, clearUnread, markAllSeen }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
