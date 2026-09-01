import React from 'react';
import { Droplet, Edit3 } from 'lucide-react';
import { BloodType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BloodTypeCardProps {
  bloodType: BloodType;
  onEdit: () => void;
}

export const BloodTypeCard: React.FC<BloodTypeCardProps> = ({ bloodType, onEdit }) => {
  const { t } = useLanguage();

  return (
    <div 
      id="blood-type-card"
      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
            <Droplet className="w-5 h-5 fill-rose-500 text-rose-500" />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{t.bloodType}</h2>
        </div>
        <button
          id="edit-blood-type-btn"
          onClick={onEdit}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{t.edit}</span>
        </button>
      </div>

      <div className="mt-6 flex items-center">
        <div className="px-6 py-4 rounded-2xl bg-[#fff7ed] border border-amber-200/60 inline-flex items-center justify-center shadow-2xs">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#c2410c] tracking-tight">
            {bloodType || 'Not set'}
          </span>
        </div>
      </div>
      <p className="mt-4 text-[12px] text-slate-400 font-medium">
        {t.bloodTypeSubtitle}
      </p>
    </div>
  );
};
