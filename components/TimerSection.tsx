

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
        // Fix: Use `number` for setInterval return type in browser environments instead of `NodeJS.Timeout`.
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

    const getStatusText = () => {
        switch (status) {
            case VotingStatus.STARTED:
                return 'Votação em andamento';
            case VotingStatus.CLOSED:
                return 'Votação encerrada';
            default:
                return 'Aguardando início da votação';
        }
    };
    
    const getContainerClass = () => {
        switch (status) {
            case VotingStatus.STARTED:
                 return 'bg-gradient-to-r from-green-500 to-green-600';
            case VotingStatus.CLOSED:
                return 'bg-gradient-to-r from-red-500 to-red-600';
            default:
                return 'bg-gradient-to-r from-blue-500 to-indigo-600';
        }
    }

    return (
        <section className={`rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 mx-1 sm:mx-2 text-white ${getContainerClass()}`}>
            <div className="text-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4">⏰ Tempo de Votação</h2>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold mb-4 bg-white bg-opacity-20 rounded-xl px-6 py-4 backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
                    {elapsedTime}
                </div>
                <p className="text-sm sm:text-base bg-white bg-opacity-15 rounded-lg px-4 py-2 inline-block font-medium">{getStatusText()}</p>
            </div>
        </section>
    );
};

export default TimerSection;
