
import React from 'react';
import { Vote } from '../types';

interface ResultsSectionProps {
    votes: Vote[];
}

const ResultsSection: React.FC<ResultsSectionProps> = React.memo(({ votes }) => {
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

    const Bar: React.FC<{ label: string, count: number, percent: number, colorClass: string, bgClass: string, icon: string }> = ({ label, count, percent, colorClass, bgClass, icon }) => (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1">
                <span className={`font-bold text-sm flex items-center gap-2 ${colorClass}`}>
                    <span>{icon}</span> {label}
                </span>
                <div className="text-right">
                    <span className={`text-lg font-black ${colorClass}`}>{percent}%</span>
                    <span className="text-xs text-slate-400 ml-2 font-medium">({count} votos)</span>
                </div>
            </div>
            <div className={`w-full rounded-full h-4 ${bgClass} overflow-hidden`}>
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative ${colorClass.replace('text-', 'bg-')}`} 
                    style={{ width: `${percent}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>
    );

    return (
        <section className="glass rounded-3xl shadow-xl p-6 md:p-8 mx-1 sm:mx-2 animate-fade-in border border-white/60">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Resultados Oficiais</h2>
                <div className="inline-block mt-2 px-4 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                    Total Computado: <span className="text-indigo-600 text-base">{totalVotes}</span>
                </div>
            </div>
            
            <div className="space-y-2">
                <Bar 
                    label="SIM (Aprovar)" 
                    count={simVotes} 
                    percent={simPercent} 
                    colorClass="text-green-600" 
                    bgClass="bg-green-100"
                    icon="✅" 
                />
                <Bar 
                    label="NÃO (Rejeitar)" 
                    count={naoVotes} 
                    percent={naoPercent} 
                    colorClass="text-red-600" 
                    bgClass="bg-red-100"
                    icon="❌"
                />
                <Bar 
                    label="ABSTENÇÃO" 
                    count={abstencaoVotes} 
                    percent={abstencaoPercent} 
                    colorClass="text-yellow-600" 
                    bgClass="bg-yellow-100"
                    icon="✋"
                />
            </div>
        </section>
    );
});

export default ResultsSection;
