
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
    // Novos campos de mapeamento
    const [segmentoColumn, setSegmentoColumn] = useState('C');
    const [representanteColumn, setRepresentanteColumn] = useState('D');
    const [eixoColumn, setEixoColumn] = useState('E');

    const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Carrega a configuração existente ao montar o componente
    useEffect(() => {
        if (sheetsConfig) {
            setUrl(sheetsConfig.google_sheet_url || '');
            setSheetName(sheetsConfig.sheet_name || 'Sheet1');
            setUsernameColumn(sheetsConfig.username_column || 'A');
            setPasswordColumn(sheetsConfig.password_column || 'B');
            if (sheetsConfig.segmento_column) setSegmentoColumn(sheetsConfig.segmento_column);
            if (sheetsConfig.representante_column) setRepresentanteColumn(sheetsConfig.representante_column);
            if (sheetsConfig.eixo_column) setEixoColumn(sheetsConfig.eixo_column);
        }
    }, [sheetsConfig]);

    const handleSave = () => {
        // Validação básica
        if (!url.includes('docs.google.com/spreadsheets')) {
            showAdminMessage('error', 'URL da planilha inválida. Certifique-se de usar um link do Google Sheets.');
            return;
        }
        if (!sheetName) {
            showAdminMessage('error', 'O nome da aba da planilha é obrigatório.');
            return;
        }

        // Cria o objeto de configuração completo
        const newConfig: SheetsConfig = {
            id: `sheets_config_${Date.now()}`,
            tipo: 'sheets_config',
            google_sheet_url: url,
            sheet_name: sheetName,
            username_column: usernameColumn.toUpperCase(),
            password_column: passwordColumn.toUpperCase(),
            segmento_column: segmentoColumn.toUpperCase(),
            representante_column: representanteColumn.toUpperCase(),
            eixo_column: eixoColumn.toUpperCase(),
            timestamp: new Date().toISOString()
        };

        // Salva via dataSdk (passado via props como onSaveSheetsConfig)
        onSaveSheetsConfig(newConfig);
        showAdminMessage('success', 'Configuração da planilha salva com sucesso!');
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
            // Adiciona parâmetro de cache-busting
            const apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_=${new Date().getTime()}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Falha na conexão: ${response.status} ${response.statusText}`);

            setTestStatus({ type: 'success', text: 'Conexão bem-sucedida! Planilha acessível.' });
        } catch (e) {
            setTestStatus({ type: 'error', text: `Erro na conexão: ${(e as Error).message}. Verifique se a planilha está "Pública na Web".` });
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔗 Configurar Autenticação Google Sheets</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="google-sheet-url" className="block text-sm font-medium text-gray-700 mb-2">URL da Planilha Google:</label>
                    <input 
                        type="url" 
                        id="google-sheet-url" 
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">A planilha deve estar visível para "Qualquer pessoa com o link".</p>
                </div>
                 <div>
                    <label htmlFor="sheet-name" className="block text-sm font-medium text-gray-700 mb-2">Nome da Aba (Sheet):</label>
                    <input 
                        type="text" 
                        id="sheet-name" 
                        value={sheetName} 
                        onChange={e => setSheetName(e.target.value)} 
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                        <label htmlFor="username-column" className="block text-sm font-medium text-gray-700 mb-2">Col. Nome:</label>
                        <input type="text" id="username-column" value={usernameColumn} onChange={e => setUsernameColumn(e.target.value)} className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg uppercase" maxLength={2}/>
                    </div>
                    <div>
                        <label htmlFor="password-column" className="block text-sm font-medium text-gray-700 mb-2">Col. CPF (Senha):</label>
                        <input type="text" id="password-column" value={passwordColumn} onChange={e => setPasswordColumn(e.target.value)} className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg uppercase" maxLength={2}/>
                    </div>
                    <div>
                        <label htmlFor="segmento-column" className="block text-sm font-medium text-gray-700 mb-2">Col. Segmento:</label>
                        <input type="text" id="segmento-column" value={segmentoColumn} onChange={e => setSegmentoColumn(e.target.value)} className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg uppercase" maxLength={2}/>
                    </div>
                    <div>
                        <label htmlFor="representante-column" className="block text-sm font-medium text-gray-700 mb-2">Col. Repres.:</label>
                        <input type="text" id="representante-column" value={representanteColumn} onChange={e => setRepresentanteColumn(e.target.value)} className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg uppercase" maxLength={2}/>
                    </div>
                    <div>
                        <label htmlFor="eixo-column" className="block text-sm font-medium text-gray-700 mb-2">Col. Eixo:</label>
                        <input type="text" id="eixo-column" value={eixoColumn} onChange={e => setEixoColumn(e.target.value)} className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg uppercase" maxLength={2}/>
                    </div>
                </div>

                <div className="flex space-x-3 pt-2">
                    <button 
                        onClick={handleSave} 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        💾 Salvar Configuração
                    </button>
                    <button 
                        onClick={handleTest} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        🧪 Testar Conexão
                    </button>
                </div>

                {testStatus && (
                    <div className={`mt-4 p-3 rounded-lg text-center border ${testStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <p className="font-semibold">{testStatus.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SheetsAuthConfig;
