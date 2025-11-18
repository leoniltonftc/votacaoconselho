
import React, { useState } from 'react';
import { LocalUser } from '../../types';
import { EIXOS } from '../../constants';

interface UserManagementProps {
    localUsers: LocalUser[];
    onCreateUser: (user: LocalUser) => void;
    onDeleteUser: (user: LocalUser) => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ localUsers, onCreateUser, onDeleteUser, showAdminMessage }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [segmento, setSegmento] = useState('');
    const [representante, setRepresentante] = useState('');
    const [eixo, setEixo] = useState('');
    const [showList, setShowList] = useState(false);

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            showAdminMessage('error', 'Nome e Senha são obrigatórios.');
            return;
        }
        
        // Verifica se a senha já existe (opcional, mas recomendado para evitar duplicidade)
        const existingUser = localUsers.find(u => u.password === password);
        if (existingUser) {
            showAdminMessage('error', 'Esta senha já está sendo usada por outro usuário.');
            return;
        }

        const newUser: LocalUser = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            tipo: 'local_user',
            username,
            password,
            segmento,
            representante,
            eixo,
            timestamp: new Date().toISOString()
        };

        onCreateUser(newUser);
        showAdminMessage('success', 'Usuário cadastrado com sucesso!');
        
        // Limpa o formulário
        setUsername('');
        setPassword('');
        setSegmento('');
        setRepresentante('');
        setEixo('');
    };

    const handleDelete = (user: LocalUser) => {
        if (window.confirm(`Tem certeza que deseja remover o usuário "${user.username}"?`)) {
            onDeleteUser(user);
            showAdminMessage('success', 'Usuário removido.');
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Cadastrar Usuário Manualmente</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário:</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso:</label>
                        <input 
                            type="text" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 12345"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Segmento:</label>
                        <input 
                            type="text" 
                            value={segmento} 
                            onChange={e => setSegmento(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Opcional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Representante:</label>
                        <input 
                            type="text" 
                            value={representante} 
                            onChange={e => setRepresentante(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Opcional"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Eixo:</label>
                         <select 
                            value={eixo} 
                            onChange={e => setEixo(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        >
                            <option value="">Opcional</option>
                            {EIXOS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                    ➕ Adicionar Usuário
                </button>
            </form>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Usuários Cadastrados ({localUsers.length})</h4>
                    <button 
                        type="button" 
                        onClick={() => setShowList(!showList)} 
                        className="text-xs text-blue-600 hover:underline"
                    >
                        {showList ? 'Ocultar Lista' : 'Mostrar Lista'}
                    </button>
                </div>
                
                {showList && (
                    <div className="bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                        {localUsers.length > 0 ? (
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-3 py-2 font-medium text-gray-700">Nome</th>
                                        <th className="px-3 py-2 font-medium text-gray-700">Senha</th>
                                        <th className="px-3 py-2 font-medium text-gray-700 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {localUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-3 py-2 text-gray-800">{user.username}</td>
                                            <td className="px-3 py-2 font-mono text-gray-600">{user.password}</td>
                                            <td className="px-3 py-2 text-right">
                                                <button 
                                                    onClick={() => handleDelete(user)} 
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="p-3 text-center text-gray-500 text-xs">Nenhum usuário cadastrado manualmente.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;