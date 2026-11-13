interface ReflectionNotesProps {
  helped?: string;
  hindered?: string;
  /** card: ekran zakończonego dnia, compact: wpis w historii */
  variant: 'card' | 'compact';
}

const STYLES = {
  card: {
    container: 'grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-sm',
    box: 'bg-stone-50 p-3.5 rounded-xl border border-stone-200',
    label: 'text-xs font-semibold block mb-1',
    text: 'text-stone-700 leading-relaxed',
    helpedLabel: '✓ Co pomogło:',
    hinderedLabel: '! Co przeszkodziło:',
  },
  compact: {
    container: 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs border-t border-stone-100',
    box: 'bg-stone-50/80 p-2.5 rounded-lg border border-stone-100',
    label: 'font-semibold block mb-0.5',
    text: 'text-stone-700',
    helpedLabel: 'Co pomogło:',
    hinderedLabel: 'Co przeszkodziło:',
  },
};

/** Wnioski z wieczornej refleksji: co pomogło i co przeszkodziło. */
export function ReflectionNotes({ helped, hindered, variant }: ReflectionNotesProps) {
  if (!helped && !hindered) return null;
  const style = STYLES[variant];

  return (
    <div className={style.container}>
      {helped && (
        <div className={style.box}>
          <span className={`${style.label} text-emerald-800`}>{style.helpedLabel}</span>
          <p className={style.text}>{helped}</p>
        </div>
      )}
      {hindered && (
        <div className={style.box}>
          <span className={`${style.label} text-amber-800`}>{style.hinderedLabel}</span>
          <p className={style.text}>{hindered}</p>
        </div>
      )}
    </div>
  );
}
