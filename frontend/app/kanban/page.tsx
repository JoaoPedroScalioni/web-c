import React from 'react';

export default function KanbanDashboard() {
  const columns = ['CRIADO', 'AGUARDANDO APROVAÇÃO', 'APROVADO', 'REJEITADO'];
  
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Elevva Kanban</h1>
        <p className="text-gray-500">Gestão B2B: Pipeline Cloud-First UX</p>
      </header>

      {/* Grid de Kanban Limpo / Quiet Luxury */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map(status => (
          <div key={status} className="w-80 flex-shrink-0 flex flex-col gap-4 bg-gray-100 p-4 rounded-xl shadow-inner border border-gray-200">
            <h2 className="text-sm font-semibold tracking-wide text-gray-500">{status}</h2>
            
            {/* Simulação SWR Polling Card */}
            {status === 'AGUARDANDO APROVAÇÃO' && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <img src="https://via.placeholder.com/400x200" alt="Video Thumb" className="rounded mb-3 w-full object-cover h-32"/>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white mb-2 uppercase tracking-widest">
                  Novo Review
                </span>
                <h3 className="text-sm font-medium mb-4 text-gray-700">Campanha Março - Outdoor B2B</h3>
                <button className="w-full bg-slate-900 text-white rounded-md p-2 text-sm font-semibold hover:bg-slate-700 transition-colors">
                  Aprovar / Abrir Pin (X,Y)
                </button>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}
