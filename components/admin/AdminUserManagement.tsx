
import React, { useState } from 'react';
import { AdminUser } from '../../types';

interface AdminUserManagementProps {
    adminUsers: AdminUser[];
    onCreateAdminUser: (user: AdminUser) => void;
    onDeleteAdminUser: (user: AdminUser) => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ adminUsers, onCreateAdminUser, onDeleteAdminUser, showAdminMessage }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showList, setShowList] = useState(false);

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            showAdminMessage('error', 'Nome de usuário e Senha são obrigatórios para administradores.');
            return;
        }
        
        const existingUser = adminUsers.find(u => u.username === username);
        if (existingUser) {
            showAdminMessage('error', 'Este nome de usuário administrativo já existe.');
            return;
        }

        const newAdmin: AdminUser = {
            id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            tipo: 'admin_user',
            username,
            password,
            timestamp: new Date().toISOString()
        };

        onCreateAdminUser(newAdmin);
        showAdminMessage('success', 'Administrador cadastrado com sucesso!');
        
        setUsername('');
        setPassword('');
    };

    const handleDelete = (user: AdminUser) => {
        if (window.confirm(`Tem certeza que deseja remover o administrador "${user.username}"?`)) {
            onDeleteAdminUser(user);
            showAdminMessage('success', 'Administrador removido.');
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🛡️ Gerenciar Administradores</h3>
            <p className="text-xs text-gray-500 mb-3">
                Cadastre usuários adicionais para acessar este painel. A senha padrão do sistema continuará funcionando.
            </p>
            <form onSubmit={handleAddUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuário Admin:</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: admin_joao"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha:</label>
                        <input 
                            type="text" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Senha forte"
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                    ➕ Adicionar Admin
                </button>
            </form>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Admins Cadastrados ({adminUsers.length})</h4>
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
                        {adminUsers.length > 0 ? (
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-3 py-2 font-medium text-gray-700">Usuário</th>
                                        <th className="px-3 py-2 font-medium text-gray-700">Senha</th>
                                        <th className="px-3 py-2 font-medium text-gray-700 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {adminUsers.map(user => (
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
                            <p className="p-3 text-center text-gray-500 text-xs">Nenhum administrador extra cadastrado.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserManagement;