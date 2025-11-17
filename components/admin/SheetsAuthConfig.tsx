
import React, { useState, useEffect } from 'react';
import { SheetsConfig } from '../../types';

interface SheetsAuthConfigProps {
    sheetsConfig: SheetsConfig | null;
    onSaveSheetsConfig: (config: SheetsConfig) => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
}

const SheetsAuthConfig: React.FC<SheetsAuthConfigProps> = ({ sheetsConfig, onSaveSheetsConfig, showAdminMessage }) => {
    const [url, setUrl] = useState('');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [usernameColumn, setUsernameColumn] = useState('A');
    const [passwordColumn, setPasswordColumn] = useState('B');
    const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (sheetsConfig) {
            setUrl(sheetsConfig.google_sheet_url);
            setSheetName(sheetsConfig.sheet_name);
            setUsernameColumn(sheetsConfig.username_column);
            setPasswordColumn(sheetsConfig.password_column);
        }
    }, [sheetsConfig]);

    const handleSave = () => {
        if (!url.includes('docs.google.com/spreadsheets')) {
            showAdminMessage('error', 'URL da planilha inválida.');
            return;
        }
        onSaveSheetsConfig({
            id: `sheets_config_${Date.now()}`,
            tipo: 'sheets_config',
            google_sheet_url: url,
            sheet_name: sheetName,
            username_column: usernameColumn,
            password_column: passwordColumn,
            timestamp: new Date().toISOString()
        });
        showAdminMessage('success', 'Configuração da planilha salva com sucesso.');
    };

    const handleTest = async () => {
        setTestStatus(null);
        if (!url) {
            setTestStatus({ type: 'error', text: 'Insira a URL da planilha para testar.' });
            return;
        }
        try {
            const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            if (!sheetIdMatch) throw new Error("URL inválida.");
            
            const sheetId = sheetIdMatch[1];
            // Add cache-busting parameter to ensure the test checks for fresh data.
            const apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_=${new Date().getTime()}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Falha na conexão: ${response.statusText}`);

            setTestStatus({ type: 'success', text: 'Conexão bem-sucedida!' });
        } catch (e) {
            setTestStatus({ type: 'error', text: `Erro na conexão: ${(e as Error).message}` });
        }
    };


    return (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔗 Configurar Autenticação Google Sheets</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="google-sheet-url" className="block text-sm font-medium text-gray-700 mb-2">URL da Planilha Google:</label>
                    <input type="url" id="google-sheet-url" value={url} onChange={e => setUrl(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" placeholder="https://docs.google.com/spreadsheets/d/..."/>
                </div>
                 <div>
                    <label htmlFor="sheet-name" className="block text-sm font-medium text-gray-700 mb-2">Nome da Aba (Sheet):</label>
                    <input type="text" id="sheet-name" value={sheetName} onChange={e => setSheetName(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="username-column" className="block text-sm font-medium text-gray-700 mb-2">Coluna Nome:</label>
                        <input type="text" id="username-column" value={usernameColumn} onChange={e => setUsernameColumn(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" maxLength={2}/>
                    </div>
                    <div>
                        <label htmlFor="password-column" className="block text-sm font-medium text-gray-700 mb-2">Coluna das Senhas:</label>
                        <input type="text" id="password-column" value={passwordColumn} onChange={e => setPasswordColumn(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" maxLength={2}/>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">💾 Salvar Configuração</button>
                    <button onClick={handleTest} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">🧪 Testar Conexão</button>
                </div>
                {testStatus && (
                    <div className={`mt-4 p-3 rounded-lg text-center ${testStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <p className="font-semibold">{testStatus.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SheetsAuthConfig;