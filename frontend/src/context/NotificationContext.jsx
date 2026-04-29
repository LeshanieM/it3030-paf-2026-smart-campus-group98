import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';
import NotificationToast from '../components/NotificationToast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const stompClientRef = useRef(null);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notification status:', error);
    }
  };

  const addToast = (notification) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...notification, toastId: id }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.toastId !== id));
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      return;
    }

    fetchStatus();

    const socket = new SockJS('/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        // console.log(str);
      },
      onConnect: () => {
        client.subscribe(`/user/${user.id}/topic/notifications`, (message) => {
          const notification = JSON.parse(message.body);
          setUnreadCount(prev => prev + 1);
          addToast(notification);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, toasts, removeToast, refreshNotifications: fetchStatus }}>
      {children}
      {toasts.map(toast => (
        <NotificationToast 
          key={toast.toastId} 
          notification={toast} 
          onClose={() => removeToast(toast.toastId)} 
        />
      ))}
    </NotificationContext.Provider>
  );
};


export const useNotifications = () => useContext(NotificationContext);

