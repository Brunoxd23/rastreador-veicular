'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type NotificationType = 'new' | 'response' | 'inProgress';

interface Notification {
  type: NotificationType;
  count: number;
}

export function useTicketNotifications() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [viewedMessages, setViewedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkTickets = async () => {
      try {
        const response = await fetch('/api/tickets', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success && data.tickets) {
          if (user.role === 'admin') {
            // Para admin, contar tickets não atendidos
            const unassignedCount = data.tickets.filter(
              (ticket: any) => !ticket.assigneeId && ticket.status === 'aberto'
            ).length;
            
            if (unassignedCount > 0) {
              setNotification({
                type: 'new',
                count: unassignedCount
              });
            } else {
              setNotification(null);
            }
          } else if (user.role === 'funcionario') {
            // Para funcionário, contar tickets atribuídos a ele
            const assignedCount = data.tickets.filter(
              (ticket: any) => ticket.assigneeId === user.id && ticket.status === 'em_andamento'
            ).length;
            
            if (assignedCount > 0) {
              setNotification({
                type: 'inProgress',
                count: assignedCount
              });
            } else {
              setNotification(null);
            }
          } else {
            // Para cliente, verificar novas mensagens
            let newMessagesCount = 0;
            data.tickets.forEach((ticket: any) => {
              if (ticket.messages?.length > 0) {
                const lastMessage = ticket.messages[ticket.messages.length - 1];
                if (lastMessage.autor !== user.id && !viewedMessages.has(lastMessage.id)) {
                  newMessagesCount++;
                }
              }
            });

            if (newMessagesCount > 0) {
              setNotification({
                type: 'response',
                count: newMessagesCount
              });
            } else {
              setNotification(null);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar tickets:', error);
      }
    };

    // Verificar tickets inicialmente e a cada 30 segundos
    checkTickets();
    const interval = setInterval(checkTickets, 30000);

    return () => clearInterval(interval);
  }, [user, viewedMessages]);

  const markMessagesAsViewed = (ticketId: string, messageId: string) => {
    setViewedMessages(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(messageId);
      return newSet;
    });
  };

  return { notification, markMessagesAsViewed };
} 