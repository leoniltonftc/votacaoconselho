
import React, { useState, useEffect } from 'react';
import { VotingStatus } from '../types';

interface TimerSectionProps {
    status: VotingStatus;
    startTime: Date | null;
    endTime: Date | null;
}

const TimerSection: React.FC<TimerSectionProps> = ({ status, startTime, endTime }) => {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    useEffect(() => {
        let interval: number | null = null;

        if (status === VotingStatus.STARTED && startTime) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
                const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                const seconds = (diff % 60).toString().padStart(2, '0');
                setElapsedTime(`${hours}:${minutes}:${seconds}`);
            }, 1000);
        } else if (status === VotingStatus.CLOSED && startTime && endTime) {
             const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
             const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
             const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
             const seconds = (diff % 60).toString().padStart(2, '0');
             setElapsedTime(`${hours}:${minutes}:${seconds}`);
        } else {
            setElapsedTime('00:00:00');
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [status, startTime, endTime]);

    const getStatusColor = () => {
        switch (status) {
            case VotingStatus.STARTED: return 'from-green-500 to-emerald-600 shadow-green-200';
            case VotingStatus.CLOSED: return 'from-slate-700 to-slate-800 shadow-slate-200';
            default: return 'from-blue-500 to-indigo-600 shadow-blue-200';
        }
    }

    return (
        <section className={`relative overflow-hidden rounded-3xl shadow-2xl mb-6 mx-1 sm:mx-2 text-white bg-gradient-to-r ${getStatusColor()} transition-all duration-500`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Cronômetro Oficial</h2>
                    <p className="text-xs opacity-60">Tempo de sessão ativo</p>
                </div>
                
                <div className="font-mono text-5xl md:text-6xl font-black tracking-wider drop-shadow-md">
                    {elapsedTime}
                </div>

                <div className="hidden md:block w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">{status === VotingStatus.STARTED ? '⚡' : '🏁'}</span>
                </div>
            </div>
        </section>
    );
};

export default TimerSection;
