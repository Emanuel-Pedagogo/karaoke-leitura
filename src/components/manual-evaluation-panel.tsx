"use client";

type ErrorCounts = {
  omissions: number;
  substitutions: number;
  hesitations: number;
};

type Props = {
  counts: ErrorCounts;
  prosodyScore: number;
  onChange: (counts: ErrorCounts, prosody: number) => void;
};

function CounterRow({
  label,
  value,
  onInc,
  onDec,
}: {
  label: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <p className="flex items-center justify-between gap-2 py-2 border-b border-foreground/10 last:border-0">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDec}
          className="w-8 h-8 rounded-full border border-foreground/20 hover:bg-foreground/5"
          aria-label={`Diminuir ${label}`}
        >
          −
        </button>
        <span className="w-8 text-center font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={onInc}
          className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-hover"
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </span>
    </p>
  );
}

export function ManualEvaluationPanel({
  counts,
  prosodyScore,
  onChange,
}: Props) {
  function update(partial: Partial<ErrorCounts>) {
    onChange({ ...counts, ...partial }, prosodyScore);
  }

  return (
    <section className="space-y-4">
      <h3 className="font-semibold">Avaliação manual</h3>
      <CounterRow
        label="Omissões"
        value={counts.omissions}
        onInc={() => update({ omissions: counts.omissions + 1 })}
        onDec={() =>
          update({ omissions: Math.max(0, counts.omissions - 1) })
        }
      />
      <CounterRow
        label="Substituições"
        value={counts.substitutions}
        onInc={() => update({ substitutions: counts.substitutions + 1 })}
        onDec={() =>
          update({ substitutions: Math.max(0, counts.substitutions - 1) })
        }
      />
      <CounterRow
        label="Hesitações"
        value={counts.hesitations}
        onInc={() => update({ hesitations: counts.hesitations + 1 })}
        onDec={() =>
          update({ hesitations: Math.max(0, counts.hesitations - 1) })
        }
      />
      <label className="block pt-2">
        <span className="text-sm font-medium">Prosódia / expressividade</span>
        <input
          type="range"
          min={1}
          max={5}
          value={prosodyScore}
          onChange={(e) => onChange(counts, Number(e.target.value))}
          className="w-full mt-2 accent-primary"
        />
        <span className="text-xs text-muted">Nota: {prosodyScore}/5</span>
      </label>
    </section>
  );
}
