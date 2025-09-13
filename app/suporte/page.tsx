"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import DateCell from "./DateCell";

export default function SuportePage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("baixa");
  const [status, setStatus] = useState("aberto");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para carregar tickets
  const loadTickets = async () => {
    try {
      const response = await fetch("/api/tickets", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        console.error("Erro ao carregar tickets");
      }
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ticketData: any = {
      title: title,
      description: description,
    };

    // Apenas incluir status e prioridade se for admin ou funcionário
    if (user?.role === "admin" || user?.role === "funcionario") {
      ticketData.status = status;
      ticketData.priority = priority;
    }

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(ticketData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Ticket criado com sucesso!");
        setTitle("");
        setDescription("");
        setPriority("baixa");
        setStatus("aberto");
        loadTickets(); // Recarrega a lista de tickets
      } else {
        toast.error(data.error || "Erro ao criar ticket");
      }
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      toast.error("Erro ao criar ticket");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tickets</h1>

      {/* Formulário de criação de ticket */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              required
            />
          </div>

          {/* Mostrar campos de status e prioridade apenas para admin e funcionário */}
          {(user?.role === "admin" || user?.role === "funcionario") && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="aberto">Aberto</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="fechado">Fechado</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition"
          >
            Criar Ticket
          </button>
        </form>
      </div>

      {/* Lista de tickets */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex gap-4 mb-4">
          <select
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            defaultValue="todos"
          >
            <option value="todos">Status: Todos</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="fechado">Fechado</option>
          </select>

          <select
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            defaultValue="todas"
          >
            <option value="todas">Prioridade: Todas</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TÍTULO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PRIORIDADE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CLIENTE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ATENDENTE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DATA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AÇÕES
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  Carregando tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  Nenhum ticket encontrado
                </td>
              </tr>
            ) : (
              tickets.map((ticket: any) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4">{ticket.title}</td>
                  <td className="px-6 py-4">{ticket.status}</td>
                  <td className="px-6 py-4">{ticket.priority}</td>
                  <td className="px-6 py-4">{ticket.user?.name || "N/A"}</td>
                  <td className="px-6 py-4">
                    {ticket.assignee?.name || "Não atribuído"}
                  </td>
                  <td className="px-6 py-4">
                    <DateCell date={ticket.createdAt} />
                  </td>
                  <td className="px-6 py-4">
                    <button className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-white font-semibold px-3 py-1 rounded transition">
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
