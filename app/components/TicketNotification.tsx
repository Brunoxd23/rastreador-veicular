'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTicketNotifications } from '../hooks/useTicketNotifications';
import { useAuth } from '../contexts/AuthContext';

export default function TicketNotification() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { notification, markMessagesAsViewed } = useTicketNotifications();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Não mostrar notificação na página de login ou quando não houver usuário
    if (pathname === '/login' || !user || !notification) {
      setShouldShow(false);
      return;
    }

    // Mostrar notificação apenas se houver notificação e contagem > 0
    setShouldShow(notification.count > 0);
  }, [pathname, user, notification]);

  if (!shouldShow || !notification) return null;

  const handleClick = () => {
    // Se houver tickets com novas mensagens, marca todas como visualizadas
    if (notification?.type === 'response' && user?.id) {
      // Busca os tickets e marca suas mensagens como visualizadas
      fetch('/api/tickets?clienteId=' + user.id)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.tickets) {
            data.tickets.forEach((ticket: any) => {
              if (ticket.mensagens?.length > 0) {
                const lastMessage = ticket.mensagens[ticket.mensagens.length - 1];
                markMessagesAsViewed(ticket.id, lastMessage.id);
              }
            });
          }
        });
    }
    
    router.push('/tickets');
  };

  const getMessage = () => {
    if (!notification) return '';

    if (user?.role === 'admin') {
      switch (notification.type) {
        case 'new':
          return 'Tickets não atendidos';
        default:
          return '';
      }
    } else {
      switch (notification.type) {
        case 'response':
          return 'Nova resposta disponível!';
        case 'inProgress':
          return 'Tickets em atendimento';
        default:
          return '';
      }
    }
  };

  const getButtonStyle = () => {
    if (!notification) return 'bg-purple-600 hover:bg-purple-700 text-white';

    if (user?.role === 'admin') {
      return 'bg-purple-600 hover:bg-purple-700 text-white';
    } else {
      switch (notification.type) {
        case 'response':
          return 'bg-green-600 hover:bg-green-700 text-white';
        case 'inProgress':
          return 'bg-yellow-600 hover:bg-yellow-700 text-white';
        default:
          return 'bg-purple-600 hover:bg-purple-700 text-white';
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce ${getButtonStyle()}`}
    >
      <span className="text-sm font-medium">{getMessage()}</span>
      <span className="bg-white text-gray-800 px-2 py-0.5 rounded-full text-xs font-bold">
        {notification.count}
      </span>
    </button>
  );
} 