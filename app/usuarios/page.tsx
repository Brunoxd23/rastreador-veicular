"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import toast from "react-hot-toast";
import Loading from "../components/Loading";
import { useAuth } from "../contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "funcionario" | "client";
  createdAt: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  numeroCelular: string;
  role: string;
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    numeroCelular: "",
    role: "client",
  });

  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role === "client") {
      router.push("/dashboard");
      return;
    }

    if (currentUser.role === "funcionario") {
      toast.error(
        "Acesso negado. Apenas administradores podem acessar esta página.",
        {
          id: "access-denied", // ID único para evitar duplicação
          duration: 3000,
        }
      );
      router.replace("/dashboard"); // Usando replace ao invés de push
      return;
    }

    fetchUsers();
  }, [currentUser, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar usuários");
      }

      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        throw new Error("Erro ao carregar dados dos usuários");
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar usuários"
      );
      if (error instanceof Error && error.message.includes("Token")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    if (!canEditUser(user)) {
      toast.error("Você não tem permissão para editar este usuário");
      return;
    }

    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      numeroCelular: (user as any).numeroCelular || "",
      role: user.role,
    });
    setShowForm(true);
  };

  // Função para verificar se pode editar o role
  const canEditRole = (userBeingEdited: User | null) => {
    if (!currentUser) return false;
    return currentUser.role === "admin";
  };

  // Função para verificar se pode editar o usuário
  const canEditUser = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    return false;
  };

  // Função para verificar se pode excluir o usuário
  const canDeleteUser = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    return false;
  };

  // Função para obter as opções de role disponíveis
  const getAvailableRoles = () => {
    if (currentUser?.role === "admin") {
      return [
        { value: "admin", label: "Administrador" },
        { value: "funcionario", label: "Funcionário" },
        { value: "client", label: "Cliente" },
      ];
    }
    // Funcionários só podem criar clientes
    return [{ value: "client", label: "Cliente" }];
  };

  // Função para filtrar usuários baseado no role do usuário atual
  const getFilteredUsers = () => {
    if (currentUser?.role === "admin") {
      return users; // Admin vê todos
    }
    if (currentUser?.role === "funcionario") {
      return users.filter((user) => user.role === "client"); // Funcionário vê apenas clientes
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToast = toast.loading(
      editingUser ? "Atualizando usuário..." : "Criando usuário..."
    );

    try {
      const url = editingUser
        ? `/api/users?id=${editingUser.id}`
        : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      // Se estiver editando e a senha estiver vazia, remove do payload
      const payload =
        editingUser && !formData.password
          ? {
              name: formData.name,
              email: formData.email,
              numeroCelular: formData.numeroCelular,
              role: formData.role,
            }
          : formData;

      // Validações de permissão
      if (currentUser?.role === "funcionario") {
        if (editingUser && editingUser.role !== "client") {
          toast.error("Funcionários só podem editar clientes", {
            id: loadingToast,
          });
          return;
        }
        if (payload.role && payload.role !== "client") {
          toast.error("Funcionários só podem criar/editar clientes", {
            id: loadingToast,
          });
          return;
        }
      }

      console.log("Enviando requisição:", { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Resposta recebida:", data);

      if (data.success) {
        toast.success(
          editingUser
            ? "Usuário atualizado com sucesso!"
            : "Usuário criado com sucesso!",
          { id: loadingToast }
        );
        setShowForm(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          numeroCelular: "",
          role: "client",
        });
        setEditingUser(null);
        await fetchUsers(); // Aguarda a atualização da lista
      } else {
        toast.error(data.error || "Erro ao salvar usuário", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro ao salvar usuário", { id: loadingToast });
    }
  };

  const handleDelete = async (userId: string, userRole: string) => {
    if (currentUser?.role !== "admin") {
      toast.error("Apenas administradores podem excluir usuários");
      return;
    }

    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      const loadingToast = toast.loading("Excluindo usuário...");

      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Authorization: `Bearer ${
              document.cookie.split("auth_token=")[1]?.split(";")[0]
            }`,
          },
        });

        console.log("Status da resposta:", response.status);
        console.log(
          "Headers da resposta:",
          Object.fromEntries(response.headers.entries())
        );

        const data = await response.json();
        console.log("Dados da resposta:", data);

        if (!response.ok) {
          throw new Error(data.error || "Erro ao excluir usuário");
        }

        if (data.success) {
          toast.success("Usuário excluído com sucesso!", { id: loadingToast });
          await fetchUsers(); // Recarrega a lista de usuários
        } else {
          throw new Error(data.error || "Erro ao excluir usuário");
        }
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        toast.error(
          error instanceof Error ? error.message : "Erro ao excluir usuário",
          { id: loadingToast }
        );
      }
    }
  };

  // Hooks para veículos e rastreadores (sempre no topo)
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [errorVeiculos, setErrorVeiculos] = useState("");
  const [posicoes, setPosicoes] = useState<any>({});

  useEffect(() => {
    if (currentUser && currentUser.role === "client") {
      async function fetchVeiculos() {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorVeiculos(
            "Token de autenticação não encontrado. Faça login novamente."
          );
          setLoadingVeiculos(false);
          return;
        }
        try {
          const res = await fetch("/api/veiculos/meus", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok) {
            setErrorVeiculos(data.error || "Erro ao buscar veículos");
          } else if (data.success && Array.isArray(data.veiculos)) {
            setVeiculos(data.veiculos);
          } else {
            setErrorVeiculos("Nenhum veículo encontrado ou erro inesperado.");
          }
        } catch {
          setErrorVeiculos("Erro ao buscar veículos");
        } finally {
          setLoadingVeiculos(false);
        }
      }
      fetchVeiculos();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === "client") {
      async function fetchPosicoes() {
        const novas: any = {};
        for (const v of veiculos) {
          if (v.rastreadores && v.rastreadores.length > 0) {
            for (const r of v.rastreadores) {
              const res = await fetch(
                `/api/rastreador/posicao?imei=${r.identificador}`
              );
              const data = await res.json();
              if (data.success) {
                novas[r.id] = {
                  lat: data.lat,
                  lng: data.lng,
                  mock: data.mock,
                  message: data.message,
                };
              }
            }
          }
        }
        setPosicoes(novas);
      }
      if (veiculos.some((v) => v.rastreadores && v.rastreadores.length > 0)) {
        fetchPosicoes();
        const interval = setInterval(fetchPosicoes, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [veiculos, currentUser]);

  const Map = dynamic(
    () => import("../configuracoes/rastreador/RastreadorMap"),
    { ssr: false }
  );

  // Render condicional: spinner global sempre antes de qualquer conteúdo
  if (loading) {
    return (
      <div className="flex w-full h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Conteúdo só renderiza após loading ser false
  if (currentUser && currentUser.role === "client") {
    if (loadingVeiculos) {
      return (
        <div className="flex w-full h-[70vh] items-center justify-center">
          <Loading />
        </div>
      );
    }
    return (
      <div>
        <Header />
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Meus Veículos</h2>
          {errorVeiculos ? (
            <div className="text-red-600 mb-4">{errorVeiculos}</div>
          ) : veiculos.length === 0 ? (
            <p className="text-gray-600">Nenhum veículo cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {veiculos.map((v) => (
                <div
                  key={v.id}
                  className="border rounded-lg p-2 shadow hover:shadow-lg transition max-w-xs w-full mx-auto text-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 10h18M3 14h18M5 6h14M5 18h14"
                      />
                    </svg>
                    <span className="font-bold text-lg">{v.plate}</span>
                  </div>
                  <div className="text-gray-700">
                    Modelo: <span className="font-medium">{v.model}</span>
                  </div>
                  <div className="text-gray-700">
                    Marca: <span className="font-medium">{v.brand}</span>
                  </div>
                  <div className="text-gray-700">
                    Ano: <span className="font-medium">{v.year}</span>
                  </div>
                  {v.rastreadores && v.rastreadores.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">
                        Rastreadores vinculados:
                      </h3>
                      {v.rastreadores.map((r: any) => (
                        <div key={r.id} className="border rounded p-3 mb-2">
                          <div className="font-bold">
                            Rastreador: {r.modelo}
                          </div>
                          <div>Identificador (IMEI): {r.identificador}</div>
                          <div className="w-full h-64 mt-2 rounded overflow-hidden relative">
                            <Map
                              lat={posicoes[r.id]?.lat ?? -23.6485}
                              lng={posicoes[r.id]?.lng ?? -46.8526}
                            />
                            {(posicoes[r.id]?.mock || !posicoes[r.id]) && (
                              <div
                                className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 text-gray-700 font-semibold text-center p-4"
                                style={{ pointerEvents: "none" }}
                              >
                                {posicoes[r.id]?.message ??
                                  "Posição real ainda não carregada. Mostrando localização padrão: Rua Marajó 166, Embu das Artes, Jardim das Oliveiras. Assim que o rastreador enviar sinal, o mapa será atualizado automaticamente."}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "funcionario":
        return "Funcionário";
      case "client":
        return "Cliente";
      default:
        return role;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "funcionario":
        return "bg-blue-100 text-blue-800";
      case "client":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex w-full h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-md shadow hover:from-blue-600 hover:to-blue-800 transition w-full sm:w-auto"
            >
              ← Voltar
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">
              Gerenciar Usuários
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  numeroCelular: "",
                  role: "client",
                });
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-md shadow hover:from-blue-600 hover:to-blue-800 transition w-full sm:w-auto"
            >
              Adicionar Usuário
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos do formulário */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de Celular
                </label>
                <input
                  type="tel"
                  value={formData.numeroCelular}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroCelular: e.target.value })
                  }
                  required
                  placeholder="(99) 99999-9999"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editingUser ? "Nova Senha (opcional)" : "Senha"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              {canEditRole(editingUser) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Usuário
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    {getAvailableRoles().map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      numeroCelular: "",
                      role: "client",
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  {editingUser ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                {currentUser?.role === "admin" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número de Celular
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredUsers().map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  {currentUser?.role === "admin" && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleStyle(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(user as any).numeroCelular || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canEditUser(user) && (
                      <button
                        onClick={() => handleEdit(user)}
                        className="mr-2 p-2 rounded hover:bg-blue-50 transition group"
                        title="Editar usuário"
                        aria-label="Editar usuário"
                      >
                        {/* Lucide Edit3 icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-blue-600 group-hover:text-blue-800"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                    )}
                    {canDeleteUser(user) && (
                      <button
                        onClick={() => handleDelete(user.id, user.role)}
                        className="p-2 rounded hover:bg-red-50 transition group"
                        title="Excluir usuário"
                        aria-label="Excluir usuário"
                      >
                        {/* Lucide Trash2 icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-red-600 group-hover:text-red-800"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
