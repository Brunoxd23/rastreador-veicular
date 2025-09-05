"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import Header from "../components/Header";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "funcionario" | "client";
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  userId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  resolution: string | null;
  user: {
    name: string;
    email: string;
    role: string;
  };
  assignee?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filtroStatus, filtroPrioridade, allTickets]);

  const fetchTickets = async () => {
    try {
      let url = "/api/tickets";
      const params = new URLSearchParams();

      if (user?.role === "client") {
        params.append("clienteId", user?.id || "");
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setAllTickets(data.tickets);
        setTickets(data.tickets);
      } else {
        toast.error("Erro ao carregar tickets");
      }
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredTickets = [...allTickets];

    if (filtroStatus) {
      filteredTickets = filteredTickets.filter(
        (ticket) => ticket.status === filtroStatus
      );
    }

    if (filtroPrioridade) {
      filteredTickets = filteredTickets.filter(
        (ticket) => ticket.priority === filtroPrioridade
      );
    }

    setTickets(filteredTickets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ticketData: any = {
        titulo,
        descricao,
        cliente: user?.id,
      };

      // Apenas inclui prioridade se for admin ou funcionário
      if (user?.role === "admin" || user?.role === "funcionario") {
        ticketData.prioridade = prioridade;
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Ticket criado com sucesso!");
        setShowForm(false);
        setTitulo("");
        setDescricao("");
        setPrioridade("");
        fetchTickets();
      } else {
        toast.error(data.message || "Erro ao criar ticket");
      }
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      toast.error("Erro ao criar ticket");
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p></p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold">Tickets</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-4 py-2 rounded hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 w-full sm:w-auto transition"
          >
            {showForm ? "Cancelar" : "Novo Ticket"}
          </button>
        </div>
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white p-4 sm:p-6 rounded-lg shadow"
          >
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Título
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={4}
                required
              />
            </div>
            {(user?.role === "admin" || user?.role === "funcionario") && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Prioridade
                </label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            )}
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-4 py-2 rounded hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 w-full sm:w-auto transition"
            >
              Criar Ticket
            </button>
          </form>
        )}

        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border rounded px-3 py-1 w-full sm:w-auto"
          >
            <option value="">Status: Todos</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="fechado">Fechado</option>
          </select>
          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="border rounded px-3 py-1 w-full sm:w-auto"
          >
            <option value="">Prioridade: Todas</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Título
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Prioridade
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      Cliente
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      Atendente
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      Data
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {ticket.title}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center">
                          <span
                            key={`status-${ticket.id}`}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              ticket.status === "aberto"
                                ? "bg-green-100 text-green-800"
                                : ticket.status === "em_andamento"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {ticket.status === "em_andamento"
                              ? "Em Andamento"
                              : ticket.status === "fechado"
                              ? "Fechado"
                              : "Aberto"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-center">
                        <span
                          key={`priority-${ticket.id}`}
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            ticket.priority === "baixa"
                              ? "bg-blue-100 text-blue-800"
                              : ticket.priority === "media"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ticket.priority.charAt(0).toUpperCase() +
                            ticket.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden sm:table-cell">
                        {ticket.user?.name || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden sm:table-cell">
                        {ticket.assignee?.name || "Não atribuído"}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden sm:table-cell">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-center flex flex-col sm:flex-row gap-2 justify-center items-center">
                        <div className="w-full flex flex-col sm:flex-row gap-1 items-stretch">
                          <button
                            key={`button-${ticket.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tickets/${ticket.id}`);
                            }}
                            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-2 py-1 rounded w-full sm:w-auto text-xs font-semibold shadow hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition"
                          >
                            Detalhes
                          </button>
                          <button
                            key={`delete-${ticket.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user?.role !== "admin") {
                                toast.error(
                                  "Apenas administradores podem excluir tickets."
                                );
                                return;
                              }
                              setConfirmDeleteId(ticket.id);
                            }}
                            className="bg-gradient-to-r from-red-600 via-red-500 to-red-400 text-white px-2 py-1 rounded w-full sm:w-auto text-xs font-semibold shadow hover:from-red-700 hover:via-red-600 hover:to-red-500 transition"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Toast de confirmação de exclusão */}
        {confirmDeleteId && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-gradient-to-r from-red-600 via-red-500 to-red-400 text-white px-4 py-3 rounded shadow-lg flex flex-col min-w-[220px]">
            <span className="font-bold mb-2">
              ⚠️ Atenção! Essa ação é irreversível.
            </span>
            <span className="mb-3">
              Tem certeza que deseja excluir este ticket?
            </span>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-white text-red-600 px-3 py-1 rounded font-semibold hover:bg-red-100 transition"
                onClick={async () => {
                  const res = await fetch(`/api/tickets/${confirmDeleteId}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success("Ticket excluído com sucesso!");
                    fetchTickets();
                  } else {
                    toast.error(data.error || "Erro ao excluir ticket");
                  }
                  setConfirmDeleteId(null);
                }}
              >
                Excluir
              </button>
              <button
                className="bg-white text-gray-800 px-3 py-1 rounded font-semibold hover:bg-gray-200 transition"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
