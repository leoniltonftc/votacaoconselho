
import React from 'react';

interface ProposalSectionProps {
    eixo: string;
    title: string;
    text: string;
}

const ProposalSection: React.FC<ProposalSectionProps> = ({ eixo, title, text }) => {
    return (
        <section className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 mx-1 sm:mx-2">
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center lg:text-left">🎯 Eixo</h2>
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                        <p className="text-gray-700 leading-relaxed font-medium text-center lg:text-left">{eixo}</p>
                    </div>
                </div>
                <div className="lg:col-span-7">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center lg:text-left">📋 Proposta em Votação</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                        <p className="text-gray-700 leading-relaxed">{text}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProposalSection;
