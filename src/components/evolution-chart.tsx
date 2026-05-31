type Point = {
  label: string;
  readings: number;
  avgAccuracy: number;
  avgWcpm: number;
};

type Props = {
  title: string;
  data: Point[];
  metric: "readings" | "avgAccuracy" | "avgWcpm";
  unit?: string;
};

function valueOf(point: Point, metric: Props["metric"]) {
  if (metric === "readings") return point.readings;
  if (metric === "avgAccuracy") return point.avgAccuracy;
  return point.avgWcpm;
}

export function EvolutionChart({ title, data, metric, unit = "" }: Props) {
  const values = data.map((p) => valueOf(p, metric));
  const max = Math.max(1, ...values);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex items-end gap-1 h-32">
        {data.map((point) => {
          const v = valueOf(point, metric);
          const h = Math.round((v / max) * 100);
          return (
            <div
              key={point.label}
              className="flex-1 flex flex-col items-center gap-1 min-w-0"
              title={`${point.label}: ${v}${unit}`}
            >
              <span className="text-[10px] text-muted tabular-nums">
                {v > 0 ? `${v}${unit}` : ""}
              </span>
              <div
                className="w-full max-w-8 mx-auto rounded-t bg-primary/80 transition-all"
                style={{ height: `${Math.max(v > 0 ? 8 : 2, h)}%` }}
              />
              <span className="text-[9px] text-muted truncate w-full text-center">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
