'use client';

import React, { useState } from 'react';

export default function CreateAdmin() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleCreateAdmin = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`Administrador criado com sucesso!\nEmail: ${data.credentials.email}\nSenha: ${data.credentials.password}`);
      } else {
        setMessage(data.message || 'Erro ao criar administrador');
      }
    } catch (error) {
      setMessage('Erro ao criar administrador');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDB = async () => {
    try {
      setResetting(true);
      const response = await fetch('/api/reset-db', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Banco de dados resetado com sucesso. Tente criar o administrador novamente.');
      } else {
        setMessage(data.message || 'Erro ao resetar banco de dados');
      }
    } catch (error) {
      setMessage('Erro ao resetar banco de dados');
      console.error(error);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Criar Administrador</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleCreateAdmin}
            disabled={loading || resetting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Criando...' : 'Criar Administrador'}
          </button>

          <button
            onClick={handleResetDB}
            disabled={loading || resetting}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {resetting ? 'Resetando...' : 'Resetar Banco de Dados'}
          </button>
        </div>

        {message && (
          <div className="mt-4 p-4 rounded bg-gray-100 whitespace-pre-line">
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 