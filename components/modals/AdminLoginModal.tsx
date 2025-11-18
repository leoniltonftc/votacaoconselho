

import React, { useState } from 'react';

interface AdminLoginModalProps {
    onClose: () => void;
    onAuthenticate: (username: string, password: string) => boolean;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onAuthenticate }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Passa tanto o usuário quanto a senha
        const success = onAuthenticate(username, password);
        if (!success) {
            setError("Credenciais inválidas. Verifique e tente novamente.");
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">🔐 Acesso Administrativo</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-2">Usuário (Opcional):</label>
                        <input
                            type="text"
                            id="admin-username"
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Deixe em branco para senha padrão"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="admin-panel-password" className="block text-sm font-medium text-gray-700 mb-2">Senha Administrativa:</label>
                        <input
                            type="password"
                            id="admin-panel-password"
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                            placeholder="Digite a senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50">
                        {isLoading ? 'Verificando...' : '🚀 Acessar Painel'}
                    </button>

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                            <span className="text-xl">❌</span>
                            <p className="font-semibold">Acesso Negado</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AdminLoginModal;