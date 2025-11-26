
import React, { useState } from 'react';
import { LocalUser } from '../../types';

interface NotificationCenterProps {
    localUsers: LocalUser[];
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ localUsers, showAdminMessage }) => {
    const [title, setTitle] = useState('🔔 Votação Iniciada!');
    const [message, setMessage] = useState('Atenção: Uma nova rodada de votação foi iniciada. Acesse o sistema para registrar seu voto.');
    const [isSending, setIsSending] = useState(false);

    const handleSimulateSend = async () => {
        if (localUsers.length === 0) {
            showAdminMessage('error', 'Não há usuários locais cadastrados para enviar lembretes.');
            return;
        }

        setIsSending(true);
        
        // Simula o tempo de envio para um backend
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsSending(false);
        showAdminMessage('success', `Lembrete enviado com sucesso para ${localUsers.length} usuários cadastrados!`);
    };

    const handleCopyToClipboard = () => {
        const fullText = `*${title}*\n\n${message}\n\nAcesse: ${window.location.origin}`;
        navigator.clipboard.writeText(fullText);
        showAdminMessage('success', 'Mensagem copiada! Cole no WhatsApp ou E-mail.');
    };

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">📢 Central de Notificações</h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {localUsers.length} Destinatários
                </span>
            </div>
            
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título do Lembrete:</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ex: Votação Aberta"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem:</label>
                    <textarea 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Digite a mensagem para os usuários..."
                    />
                </div>

                <div className="pt-2 flex gap-3">
                    <button 
                        onClick={handleSimulateSend} 
                        disabled={isSending || localUsers.length === 0}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${isSending ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
                    >
                        {isSending ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enviando...
                            </>
                        ) : (
                            <>🚀 Enviar Lembrete</>
                        )}
                    </button>
                    
                    <button 
                        onClick={handleCopyToClipboard}
                        className="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 px-4 rounded-lg text-sm transition-colors border border-green-200"
                        title="Copiar para colar no WhatsApp"
                    >
                        📋 Copiar
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                    * O envio simula a notificação para os usuários cadastrados localmente.
                </p>
            </div>
        </div>
    );
};

export default NotificationCenter;
