import { useLanguage } from "./site";
import type { StoredReport } from "@/lib/scout.report";
import { partName, localizedPart } from "@/components/recall-record";

type Complaint = StoredReport["evidence"]["complaints"]["items"][number];

export type ComplaintGroup = { part: string; meaning: string | null; complaints: Complaint[] };

/** Group complaints by part, sorted A to Z, so buyers see the pattern instead of separate scary stories. */
export function groupComplaints(complaints: Complaint[]): ComplaintGroup[] {
  const groups = new Map<string, ComplaintGroup>();
  for (const complaint of complaints) {
    const firstComponent = complaint.components.split(",")[0]?.trim() ?? complaint.components;
    const part = partName(firstComponent);
    // Unmapped parts come back lowercase; capitalize so any future car reads cleanly and variants merge.
    const name = part.meaning ? part.name : part.name.charAt(0).toUpperCase() + part.name.slice(1);
    const existing = groups.get(name);
    if (existing) existing.complaints.push(complaint);
    else groups.set(name, { part: name, meaning: part.meaning, complaints: [complaint] });
  }
  return [...groups.values()].sort((a, b) => a.part.localeCompare(b.part));
}

export function biggestGroup(groups: ComplaintGroup[]): ComplaintGroup | null {
  return groups.reduce<ComplaintGroup | null>((best, group) => (best && best.complaints.length >= group.complaints.length ? best : group), null);
}

export function ComplaintGroups({ complaints }: { complaints: Complaint[] }) {
  const { language } = useLanguage();
  const es = language === "es";
  const groups = groupComplaints(complaints).map((group) => es ? { ...group, part: localizedPart(group.complaints[0]?.components ?? "", language).name, meaning: localizedPart(group.complaints[0]?.components ?? "", language).meaning } : group);
  const biggest = biggestGroup(groups);
  return (
    <div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
{es ? "Las quejas son experiencias individuales, no prueban que todos los autos tengan ese problema. Úsalas como puntos para revisar al manejar." : "Complaints are one owner's experience, not proof every car has this problem. Use them as things to check on a test drive."}
      </p>
      {biggest && groups.length > 1 ? (
        <p className="mt-2 text-sm font-medium">
          {es ? "La mayoría de las quejas mostradas trata de" : "Most complaints shown are about"} {biggest.part.toLowerCase()} ({biggest.complaints.length} {es ? "de" : "of"} {complaints.length}).
        </p>
      ) : null}
      <ul className="mt-3">
        {groups.map((group) => (
          <li key={group.part} className="border-t border-border py-4 text-sm first:border-t-0">
            <p className="font-medium capitalize">
              {group.part}
              {group.complaints.length > 1 ? (
                <span className="ml-2 font-normal text-muted-foreground">{group.complaints.length} {es ? "quejas" : "complaints"}</span>
              ) : null}
            </p>
            {group.meaning ? <p className="mt-1 text-muted-foreground">{group.meaning}</p> : null}
            <ul className="mt-2 space-y-3">
              {group.complaints.map((c) => (
                <li key={c.odiNumber} className="border-l-2 border-border pl-3">
                  <p className="leading-relaxed text-muted-foreground">{c.summary}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {c.filed}
                    {c.crash ? es ? " · hubo un choque" : " · involved a crash" : ""}
                    {c.fire ? es ? " · hubo un incendio" : " · involved a fire" : ""}
                    {c.injuries > 0 ? ` · ${c.injuries} ${es ? "lesiones" : c.injuries === 1 ? "injury" : "injuries"}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
