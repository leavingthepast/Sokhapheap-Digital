import React from 'react';
import { Syringe, Plus, Calendar, Trash2, Edit2 } from 'lucide-react';
import { Vaccination } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface VaccinationsCardProps {
  vaccinations: Vaccination[];
  onAddVaccination: () => void;
  onEditVaccination: (vaccine: Vaccination) => void;
  onDeleteVaccination: (id: string) => void;
}

export const VaccinationsCard: React.FC<VaccinationsCardProps> = ({
  vaccinations,
  onAddVaccination,
  onEditVaccination,
  onDeleteVaccination,
}) => {
  const { t } = useLanguage();

  return (
    <div 
      id="vaccinations-card"
      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <Syringe className="w-5 h-5 text-sky-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{t.vaccinations}</h2>
        </div>
        <button
          id="add-vaccination-btn"
          onClick={onAddVaccination}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addVaccination}</span>
        </button>
      </div>

      <div className="mt-5 space-y-3 flex-1">
        {vaccinations.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">
            {t.noVaccinations}
          </div>
        ) : (
          vaccinations.map((vac) => (
            <div
              key={vac.id}
              className="group flex items-start justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {vac.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono text-teal-700 font-medium bg-teal-50/80 px-2 py-0.5 rounded">
                    <Calendar className="w-3 h-3" />
                    {vac.date}
                  </span>
                  {vac.provider && (
                    <span className="truncate max-w-[200px] text-slate-400">
                      • {vac.provider}
                    </span>
                  )}
                </div>
                {vac.notes && (
                  <p className="text-xs text-slate-500 pt-0.5 italic">
                    "{vac.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button
                  onClick={() => onEditVaccination(vac)}
                  className="p-1 text-slate-400 hover:text-teal-700 rounded hover:bg-slate-200/60"
                  title="Edit vaccination"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteVaccination(vac.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200/60"
                  title="Delete vaccination"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-[12px] text-slate-400 font-medium">
        {t.vaccinationsSubtitle}
      </p>
    </div>
  );
};
