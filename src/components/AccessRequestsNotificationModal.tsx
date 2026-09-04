import React, { useState } from 'react';
import { Patient, QrAccessRequest, QrAccessStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { updateQrAccessDecision } from '../utils/qrAccessManager';
import {
  Bell,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  User,
  Building,
  Check,
  Ban,
  Filter,
} from 'lucide-react';

interface AccessRequestsNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onUpdatePatient: (updated: Patient) => void;
}

export const AccessRequestsNotificationModal: React.FC<AccessRequestsNotificationModalProps> = ({
  isOpen,
  onClose,
  patient,
  onUpdatePatient,
}) => {
  const { t } = useLanguage();
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'allowed' | 'not_allowed'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const requests = patient.accessRequests || [];

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const allowedCount = requests.filter((r) => r.status === 'allowed').length;
  const notAllowedCount = requests.filter((r) => r.status === 'not_allowed').length;

  const filteredRequests = requests.filter((r) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return r.status === 'pending';
    if (filterTab === 'allowed') return r.status === 'allowed';
    if (filterTab === 'not_allowed') return r.status === 'not_allowed';
    return true;
  });

  const handleDecision = async (requestId: string, decision: 'allowed' | 'not_allowed') => {
    setProcessingId(requestId);
    try {
      // 1. Update state in patient object
      const updatedRequests = requests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: decision,
            respondedAt: new Date().toISOString(),
          };
        }
        return r;
      });

      const updatedPatient: Patient = {
        ...patient,
        accessRequests: updatedRequests,
      };

      onUpdatePatient(updatedPatient);

      // 2. Broadcast and notify server
      await updateQrAccessDecision(patient.id, requestId, decision);
    } catch (err) {
      console.error('Failed to update access decision:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-200 border border-white/20">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {t.accessNotifications || 'Access Requests'}
              </h2>
              <p className="text-xs text-teal-100/80">
                Manage who can view your medical records via QR code
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar (All, Pending, Allowed, Not Allowed) */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          {/* All */}
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <span>{t.allRequests || 'All'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-semibold">
              {requests.length}
            </span>
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{t.pending || 'Pending'}</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-black animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Allowed */}
          <button
            type="button"
            onClick={() => setFilterTab('allowed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterTab === 'allowed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{t.allowedRequests || 'Allowed'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-semibold">
              {allowedCount}
            </span>
          </button>

          {/* Not Allowed */}
          <button
            type="button"
            onClick={() => setFilterTab('not_allowed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterTab === 'not_allowed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>{t.notAllowedRequests || 'Not Allowed'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-900 font-semibold">
              {notAllowedCount}
            </span>
          </button>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No requests found</p>
              <p className="text-xs text-slate-400 mt-1">
                {filterTab === 'pending'
                  ? 'No pending access requests at the moment.'
                  : filterTab === 'allowed'
                  ? 'No approved scanners yet.'
                  : filterTab === 'not_allowed'
                  ? 'No blocked access requests.'
                  : 'Scan requests will appear here when doctors or scanners scan your QR code.'}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Requester Info */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      req.status === 'allowed'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : req.status === 'not_allowed'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200 animate-pulse'
                    }`}
                  >
                    {req.status === 'allowed' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : req.status === 'not_allowed' ? (
                      <Ban className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {req.requesterName}
                      </h4>
                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          req.status === 'allowed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'not_allowed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}
                      >
                        {req.status === 'allowed'
                          ? t.allowed || 'Allowed'
                          : req.status === 'not_allowed'
                          ? t.notAllowed || 'Not Allowed'
                          : t.pending || 'Pending'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>{req.requesterRole || 'Clinical Doctor'}</span>
                      {req.requesterLocation && (
                        <>
                          <span>•</span>
                          <span>{req.requesterLocation}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-slate-400 font-medium">
                        {formatTime(req.requestedAt)}
                      </span>
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Ref: {req.id}
                    </p>
                  </div>
                </div>

                {/* Actions (Allow vs Not Allowed buttons) */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end shrink-0">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleDecision(req.id, 'allowed')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.allow || 'Allow'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleDecision(req.id, 'not_allowed')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t.notAllowed || 'Not Allowed'}</span>
                      </button>
                    </>
                  ) : req.status === 'allowed' ? (
                    <button
                      type="button"
                      disabled={processingId === req.id}
                      onClick={() => handleDecision(req.id, 'not_allowed')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      title="Revoke access"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{t.notAllowed || 'Change to Not Allowed'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={processingId === req.id}
                      onClick={() => handleDecision(req.id, 'allowed')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.allow || 'Change to Allow'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-teal-600" />
            <span>Scanners with allowed access can view only. File downloads are restricted.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
