import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('careelderly_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const socketRef = useRef(null);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('careelderly_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage', e);
    }
  }, [notifications]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to CareElderly real-time gateway:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    // 1. Listen for Booking Status Updates
    newSocket.on('booking:statusUpdated', (data) => {
      console.log('[Socket Event] booking:statusUpdated:', data);
      const statusTitle = data.status
        ? data.status.charAt(0).toUpperCase() + data.status.slice(1).replace('_', ' ')
        : 'Updated';

      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'status_update',
        title: `Care Shift ${statusTitle}`,
        message: `Booking #${data.bookingId} status is now ${statusTitle}.`,
        link: `/bookings/${data.bookingId}`,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      toast.info(`Care Shift Status: ${statusTitle}`, {
        description: `Booking #${data.bookingId} has transitioned to ${statusTitle}.`,
        action: {
          label: 'View Booking',
          onClick: () => {
            window.location.href = `/bookings/${data.bookingId}`;
          },
        },
      });
    });

    // 2. Listen for Incoming Caregiver Requests
    newSocket.on('caregiver:newRequest', (data) => {
      console.log('[Socket Event] caregiver:newRequest:', data);
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'new_request',
        title: 'New Care Shift Request',
        message: data.summary?.patientName
          ? `Care requested for ${data.summary.patientName} (${data.summary.serviceName || 'Healthcare Service'}).`
          : `New care shift requested (#${data.bookingId}).`,
        link: `/bookings/${data.bookingId}`,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      toast.success('New Shift Booking Request!', {
        description: data.summary?.serviceName
          ? `${data.summary.serviceName} scheduled on ${data.summary.scheduledDate}.`
          : `You have received a new care shift booking (#${data.bookingId}).`,
        action: {
          label: 'Review Request',
          onClick: () => {
            window.location.href = `/bookings/${data.bookingId}`;
          },
        },
      });
    });

    // 3. Listen for Newly Logged Care Notes & Vitals
    newSocket.on('careNote:added', (data) => {
      console.log('[Socket Event] careNote:added:', data);
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'care_note',
        title: 'New Clinical Care Note',
        message: `Caregiver logged updated vital signs and shift observations for booking #${data.bookingId}.`,
        link: `/bookings/${data.bookingId}`,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      toast.success('Clinical Care Note Recorded', {
        description: `Caregiver updated vitals and clinical observations for Booking #${data.bookingId}.`,
        action: {
          label: 'View Vitals',
          onClick: () => {
            window.location.href = `/bookings/${data.bookingId}`;
          },
        },
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token, user]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
