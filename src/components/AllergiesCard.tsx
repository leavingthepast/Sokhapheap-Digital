import React from 'react';
import { AlertTriangle, Plus, Trash2, Edit2 } from 'lucide-react';
import { Allergy } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AllergiesCardProps {
  allergies: Allergy[];
  onAddAllergy: () => void;
  onEditAllergy: (allergy: Allergy) => void;
  onDeleteAllergy: (id: string) => void;
}

export const AllergiesCard: React.FC<AllergiesCardProps> = ({
  allergies,
  onAddAllergy,
  onEditAllergy,
  onDeleteAllergy,
}) => {
  const { t } = useLanguage();

  return (
    <div 
      id="allergies-card"
      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{t.allergies}</h2>
        </div>
        <button
          id="add-allergy-btn"
          onClick={onAddAllergy}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addAllergy}</span>
        </button>
      </div>

      <div className="mt-5 space-y-3 flex-1">
        {allergies.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">
            {t.noAllergies}
          </div>
        ) : (
          allergies.map((allergy) => (
            <div
              key={allergy.id}
              className="group flex items-start justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm capitalize">
                    {allergy.name}
                  </span>
                  {allergy.severity && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        allergy.severity === 'Severe'
                          ? 'bg-rose-100 text-rose-700'
                          : allergy.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {allergy.severity === 'Severe' ? t.severe : allergy.severity === 'Moderate' ? t.moderate : t.mild}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {allergy.reaction || 'No specific reaction noted'}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditAllergy(allergy)}
                  className="p-1 text-slate-400 hover:text-teal-700 rounded hover:bg-slate-200/60"
                  title="Edit allergy"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteAllergy(allergy.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200/60"
                  title="Delete allergy"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-[12px] text-slate-400 font-medium">
        {t.allergiesSubtitle}
      </p>
    </div>
  );
};
