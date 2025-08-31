'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { toast } from 'react-hot-toast';

export default function PainelAdmin() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalTickets: 0,
    totalRevenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user?.role === 'client') {
      router.push('/dashboard');
      return;
    }

    if (!loading && user?.role === 'funcionario') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.', {
        id: 'access-denied',
        duration: 3000
      });
      router.replace('/dashboard');
      return;
    }

    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'auth_token': localStorage.getItem('auth_token') || ''
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar estatísticas');
      }

      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar estatísticas');
      if (error instanceof Error && error.message.includes('Token')) {
        router.push('/login');
      }
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return <Loading />;
  }

  // Se não for admin, não renderiza nada
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <Header />
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-6">Painel Administrativo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Cards de Estatísticas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total de Usuários</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total de Veículos</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalVehicles}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tickets Abertos</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalTickets}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Receita Total</h3>
            <p className="text-3xl font-bold text-yellow-600">
              R$ {stats.totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ações Rápidas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/usuarios')}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Gerenciar Usuários
              </button>
              
              <button
                onClick={() => router.push('/veiculos')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Gerenciar Veículos
              </button>
              
              <button
                onClick={() => router.push('/tickets')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Gerenciar Tickets
              </button>
              
              <button
                onClick={() => router.push('/configuracoes')}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Configurações do Sistema
              </button>
            </div>
          </div>

          {/* Atividades Recentes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Em breve: Lista de atividades recentes do sistema
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 