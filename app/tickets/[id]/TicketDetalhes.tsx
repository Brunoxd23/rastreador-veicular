"use client";

import React, { useState, useEffect, useCallback } from "react";
import DateCell from "../../suporte/DateCell";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { useTicketNotifications } from "../../hooks/useTicketNotifications";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "funcionario" | "client";
}

interface Message {
  id: string;
  content: string;
  userId: string;
  ticketId: string;
  data: Date;
  user: {
    name: string;
  };
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  userId: string;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    email: string;
    role: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  messages: Message[];
}

interface Props {
  id: string;
}

const formatStatus = (status: string) => {
  switch (status) {
    case "aberto":
      return "Aberto";
    case "em_andamento":
      return "Em Andamento";
    case "fechado":
      return "Fechado";
    default:
      return status;
  }
};

const formatPriority = (priority: string) => {
  switch (priority) {
    case "baixa":
      return "Baixa";
    case "media":
      return "Média";
    case "alta":
      return "Alta";
    default:
      return priority;
  }
};

// Removido formatDate para evitar hidratação

export default function TicketDetalhes({ id }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { markMessagesAsViewed } = useTicketNotifications();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [funcionarios, setFuncionarios] = useState<User[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedPrioridade, setSelectedPrioridade] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Buscar funcionários disponíveis
  useEffect(() => {
    if (user?.role === "admin") {
      fetch("/api/users?role=funcionario")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFuncionarios(data.users);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar funcionários:", error);
        });
    }
  }, [user]);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/tickets/${id}`);
        const data = await response.json();

        if (data.success) {
          setTicket(data.ticket);
          // Marcar mensagens como visualizadas apenas se houver mensagens
          if (data.ticket.messages && data.ticket.messages.length > 0) {
            const lastMessage =
              data.ticket.messages[data.ticket.messages.length - 1];
            markMessagesAsViewed(id, lastMessage.id);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar ticket:", error);
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  // Mostrar toast de prioridade apenas quando o modal de atribuição for aberto
  useEffect(() => {
    if (
      showAssignModal &&
      ticket &&
      (user?.role === "admin" || user?.role === "funcionario")
    ) {
      if (ticket.priority === "alta") {
        toast(
          "⚠️ ATENÇÃO: Este ticket tem prioridade ALTA!\nRequer atenção imediata e resolução urgente.",
          {
            duration: 5000,
            style: {
              background: "#ef4444",
              color: "#fff",
            },
          }
        );
      } else if (ticket.priority === "media") {
        toast(
          "⚠️ ATENÇÃO: Este ticket tem prioridade MÉDIA!\nRequer atenção assim que possível.",
          {
            duration: 5000,
            style: {
              background: "#f59e0b",
              color: "#fff",
            },
          }
        );
      }
    }
  }, [showAssignModal, ticket?.priority, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim() || enviandoMensagem || !mounted) return;

    setEnviandoMensagem(true);
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto: mensagem,
          autor: user?.id,
          isAtendente: user?.role === "admin" || user?.role === "funcionario",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMensagem("");
        setTicket(data.ticket);
        setEnviandoMensagem(false);
        toast.success("Mensagem enviada com sucesso!");
        // Removido reload para evitar loop
      } else {
        toast.error(data.message || "Erro ao enviar mensagem", {
          duration: 4000,
        });
        setEnviandoMensagem(false);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem", { duration: 4000 });
      setEnviandoMensagem(false);
    }
  };

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!mounted || !ticket) return;

      try {
        const response = await fetch(`/api/tickets/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            assigneeId: selectedEmployee || user?.id,
            priority: ticket.priority, // Manter a prioridade atual
          }),
        });

        const data = await response.json();

        if (data.success) {
          setTicket(data.ticket);
          toast.success("Status atualizado com sucesso!");
        } else {
          toast.error(data.message || "Erro ao atualizar status");
        }
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        toast.error("Erro ao atualizar status");
      }
    },
    [id, user, mounted, selectedEmployee, ticket]
  );

  const handleAssignTicket = async () => {
    if (!ticket || !user?.id) return;

    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority: selectedPrioridade,
          assigneeId: selectedEmployee || user.id,
          status: "em_andamento",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atribuir ticket");
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Erro ao parsear resposta:", text);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (data.success && data.ticket) {
        setTicket(data.ticket);
        setShowAssignModal(false);
        toast.success("Ticket atribuído com sucesso!");
      } else {
        toast.error(data.message || "Erro ao atualizar ticket");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atribuir ticket");
    }
  };

  // Função para renderizar o botão de atribuição
  const renderAssignButton = () => {
    if (!ticket || user?.role === "client") return null;

    return (
      <button
        onClick={() => {
          setSelectedPrioridade("");
          setSelectedEmployee("");
          setShowAssignModal(true);
        }}
        className="px-4 py-2 rounded font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white transition"
      >
        Atribuir Ticket
      </button>
    );
  };

  // Função para renderizar o modal de atribuição
  const renderAssignModal = () => {
    if (!showAssignModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Atribuir Ticket</h3>

          <div className="space-y-4">
            {user?.role === "admin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecionar Funcionário
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {funcionarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade do Ticket
              </label>
              <select
                value={selectedPrioridade}
                onChange={(e) => setSelectedPrioridade(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Selecione a prioridade</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedEmployee("");
                setSelectedPrioridade("");
              }}
              className="px-4 py-2 text-sm font-medium rounded bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300 hover:from-blue-200 hover:via-blue-300 hover:to-blue-400 text-blue-700 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignTicket}
              disabled={
                !selectedPrioridade ||
                (user?.role === "admin" && !selectedEmployee)
              }
              className="px-4 py-2 text-sm font-medium rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Função para renderizar o status do atendimento
  const renderAssignmentStatus = () => {
    if (!ticket) return null;

    if (!ticket.assignee) {
      return (
        <div className="text-yellow-600 font-medium">Aguardando atribuição</div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="font-medium">Atendente:</span>
        <span
          className={`${
            ticket.assignee.id === user?.id ? "text-green-600" : "text-gray-600"
          }`}
        >
          {ticket.assignee.name}
        </span>
        {ticket.assignee.id === user?.id && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Você
          </span>
        )}
      </div>
    );
  };

  // Botão de status (fechar/reabrir)
  const renderStatusButton = () => {
    if (!ticket || !user || user.role === "client") return null;

    if (ticket.status === "fechado") {
      return (
        <button
          onClick={() => handleStatusChange("em_andamento")}
          className="px-4 py-2 rounded font-semibold bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-400 text-white transition"
        >
          Reabrir Ticket
        </button>
      );
    }

    return (
      <button
        onClick={() => handleStatusChange("fechado")}
        className="px-4 py-2 rounded font-semibold bg-gradient-to-r from-red-600 via-red-500 to-red-400 hover:from-red-700 hover:via-red-600 hover:to-red-500 text-white transition"
      >
        Fechar Ticket
      </button>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Ticket não encontrado</p>
          <button
            onClick={() => router.push("/tickets")}
            className="mt-4 px-4 py-2 rounded font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white transition"
          >
            Voltar para Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{ticket.title}</h1>
          <div className="flex gap-2">
            {renderStatusButton()}
            {renderAssignButton()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Criado por</p>
            <p className="font-medium">{ticket.user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Data de criação</p>
            <p className="font-medium">
              <DateCell date={ticket.createdAt} />
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-medium">{formatStatus(ticket.status)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Prioridade</p>
            <p className="font-medium">{formatPriority(ticket.priority)}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Descrição</p>
          <p className="text-gray-800 whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {renderAssignmentStatus()}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Mensagens</h2>
        <div className="space-y-4 mb-6">
          {(ticket.messages ?? []).length === 0 ? (
            <p className="text-gray-500">Nenhuma mensagem ainda.</p>
          ) : (
            (ticket.messages ?? []).map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.userId === user?.id
                    ? "bg-purple-50 ml-8"
                    : "bg-gray-50 mr-8"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm">{message.user.name}</p>
                  <p className="text-xs text-gray-500">
                    <DateCell date={message.data} />
                  </p>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="mensagem"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nova Mensagem
            </label>
            <textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full p-3 border rounded-md"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={enviandoMensagem}
              className="px-4 py-2 rounded font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white transition disabled:opacity-50"
            >
              {enviandoMensagem ? "Enviando..." : "Enviar Mensagem"}
            </button>
          </div>
        </form>
      </div>

      {renderAssignModal()}
    </div>
  );
}
