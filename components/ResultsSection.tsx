
import React from 'react';
import { Vote } from '../types';

interface ResultsSectionProps {
    votes: Vote[];
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ votes }) => {
    const simVotes = votes.filter(v => v.voto === 'SIM').length;
    const naoVotes = votes.filter(v => v.voto === 'NÃO').length;
    const abstencaoVotes = votes.filter(v => v.voto === 'ABSTENÇÃO').length;
    const totalVotes = votes.length;

    const getPercent = (count: number) => {
        return totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    };

    const simPercent = getPercent(simVotes);
    const naoPercent = getPercent(naoVotes);
    const abstencaoPercent = getPercent(abstencaoVotes);

    return (
        <section className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8 mx-1 sm:mx-2">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center px-2">Resultados da Votação</h2>
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="text-center bg-gray-50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">Total de Votos</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{totalVotes}</p>
                </div>
                <div className="space-y-3 sm:space-y-4">
                    {/* SIM */}
                    <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                            <span className="font-semibold text-green-800 text-sm sm:text-base">✅ SIM</span>
                            <span className="font-bold text-green-600 text-sm sm:text-base">{simVotes} votos ({simPercent}%)</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-3 sm:h-4">
                            <div className="result-bar bg-green-500 h-3 sm:h-4 rounded-full" style={{ width: `${simPercent}%` }}></div>
                        </div>
                    </div>
                    {/* NÃO */}
                    <div className="bg-red-50 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                            <span className="font-semibold text-red-800 text-sm sm:text-base">❌ NÃO</span>
                            <span className="font-bold text-red-600 text-sm sm:text-base">{naoVotes} votos ({naoPercent}%)</span>
                        </div>
                        <div className="w-full bg-red-200 rounded-full h-3 sm:h-4">
                            <div className="result-bar bg-red-500 h-3 sm:h-4 rounded-full" style={{ width: `${naoPercent}%` }}></div>
                        </div>
                    </div>
                    {/* ABSTENÇÃO */}
                    <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                            <span className="font-semibold text-yellow-800 text-sm sm:text-base">⚪ ABSTENÇÃO</span>
                            <span className="font-bold text-yellow-600 text-sm sm:text-base">{abstencaoVotes} votos ({abstencaoPercent}%)</span>
                        </div>
                        <div className="w-full bg-yellow-200 rounded-full h-3 sm:h-4">
                            <div className="result-bar bg-yellow-500 h-3 sm:h-4 rounded-full" style={{ width: `${abstencaoPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResultsSection;
