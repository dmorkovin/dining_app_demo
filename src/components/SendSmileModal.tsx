import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DEMO_MODE } from '../lib/demoMode';
import type { Database } from '../lib/database.types';

type Staff = Database['public']['Tables']['staff']['Row'];

interface SendSmileModalProps {
  userId: string;
  isOpen: boolean;
  staff: Staff | null;
  onClose: () => void;
}

export function SendSmileModal({ userId, isOpen, staff, onClose }: SendSmileModalProps) {
  const { t } = useTranslation('common');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!staff || sending) return;
    setSending(true);
    setError(null);

    if (DEMO_MODE) {
      setMessage('');
      setSending(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
      return;
    }

    const { error: smileError } = await supabase
      .from('smiles_sent')
      .insert({
        user_id: userId,
        staff_id: staff.id,
        message: message.trim(),
      });
    if (smileError) {
      setSending(false);
      setError(t('sendSmile.error'));
      return;
    }
    const { error: countError } = await supabase.rpc('increment_smile_count', {
      staff_id: staff.id,
    });
    if (countError) console.warn('Smile count not updated:', countError.message);
    setMessage('');
    setSending(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2000);
  };

  if (!isOpen && !success) return null;
  if (!staff) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white rounded-[14px] w-full max-w-md card-shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-navy)]">{t('sendSmile.title')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('sendSmile.to', { name: staff.name })}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {success ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-[var(--color-navy)] font-semibold text-lg">{t('sendSmile.success')}</p>
                <p className="text-gray-500 text-sm text-center">
                  {t('sendSmile.received', { name: staff.name })}
                </p>
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('sendSmile.placeholder')}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-orange)] resize-none"
                  style={{ fontSize: '16px' }}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </p>
                )}
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full mt-4 py-3 bg-[var(--color-orange)] text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? t('sendSmile.sending') : t('sendSmile.send')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
