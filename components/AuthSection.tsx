import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SheetsConfig, LocalUser } from '../types';

interface AuthSectionProps {
    onAuthenticate: (code: string) => void;
    sheetsConfig: SheetsConfig | null;
    localUsers: LocalUser[];
}

// Adicionada função de análise de CSV robusta para lidar com valores que contêm vírgulas e aspas.
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { // Lida com aspas duplas escapadas ""
                current += '"';
                i++; // Pula a próxima aspa
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}


const AuthSection: React.FC<AuthSectionProps> = ({ onAuthenticate, sheetsConfig, localUsers }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const extractSheetId = (url: string) => {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    }

    const buildSheetsApiUrl = (sheetId: string, sheetName: string, range: string) => {
        // Add cache-busting parameter to prevent issues with stale data on different devices.
        return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(range)}&_=${new Date().getTime()}`;
    }

    const fetchGoogleSheetsData = async (config: SheetsConfig) => {
        if (!config || !config.google_sheet_url) {
            throw new Error('Configuração da planilha não encontrada');
        }
        const sheetId = extractSheetId(config.google_sheet_url);
        if (!sheetId) {
            throw new Error('URL da planilha inválida.');
        }

        const range = `A1:Z1000`;
        const apiUrl = buildSheetsApiUrl(sheetId, config.sheet_name, range);

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Erro de conexão (${response.status}). Verifique se a planilha está pública.`);
        }
        return await response.text();
    };
    
    const authenticateWithGoogleSheets = async (pass: string) => {
        if (!sheetsConfig) throw new Error("Google Sheets não configurado.");

        const csvText = await fetchGoogleSheetsData(sheetsConfig);
        const lines = csvText.trim().split(/\r?\n/);
        
        // Pula a linha de cabeçalho para evitar comparar a senha com o título da coluna.
        const dataLines = lines.slice(1);
        
        const usernameColIndex = sheetsConfig.username_column.toUpperCase().charCodeAt(0) - 65;
        const passwordColIndex = sheetsConfig.password_column.toUpperCase().charCodeAt(0) - 65;

        for (const line of dataLines) {
            const values = parseCsvLine(line);
            const sheetPassword = values[passwordColIndex];
            if (sheetPassword === pass) {
                return { success: true, auxiliaryData: values[usernameColIndex] || 'Usuário Autenticado' };
            }
        }
        return { success: false, auxiliaryData: null };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        const trimmedPassword = password.trim();

        try {
            // 1. Verificar usuários locais primeiro (prioridade)
            const localUser = localUsers.find(u => u.password === trimmedPassword);
            if (localUser) {
                onAuthenticate(localUser.username);
                setIsLoading(false);
                return;
            }

            // 2. Se não achar localmente e tiver config de planilha, tenta na planilha
            if (sheetsConfig) {
                const authResult = await authenticateWithGoogleSheets(trimmedPassword);
                if (authResult.success) {
                    onAuthenticate(authResult.auxiliaryData!);
                } else {
                    setError("Código inválido. Verifique seu código e tente novamente.");
                }
            } else {
                 setError("Usuário não encontrado e autenticação externa não configurada.");
            }

        } catch (err) {
            setError((err as Error).message || "Erro ao autenticar. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 mx-1 sm:mx-2">
            <div className="text-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 px-2">🔐 Acesso ao Sistema de Votação</h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">Para participar da votação, digite sua senha de acesso:</p>
                <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                    <div>
                        <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 mb-2">Senha:</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="user-password"
                                className="w-full px-4 py-3 pr-12 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <span className="text-xl">{showPassword ? '🙈' : '👁️'}</span>
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? 'Verificando...' : '🚀 Acessar Sistema'}
                    </button>

                    {error && (
                         <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                           <span className="text-xl">❌</span>
                           <p className="font-semibold">Erro na Autenticação</p>
                           <p className="text-sm">{error}</p>
                         </div>
                    )}

                    {isLoading && (
                        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-center">
                            <span className="text-xl">🔄</span>
                            <p className="font-semibold">Verificando código...</p>
                        </div>
                    )}
                </form>
            </div>
        </section>
    );
};

export default AuthSection;