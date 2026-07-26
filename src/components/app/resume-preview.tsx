"use client";
import type { ResumeData } from "@/lib/types";

interface ResumePreviewProps {
  data: ResumeData;
  template: "classic" | "modern" | "minimal";
  color?: string;
}

export function ResumePreview({ data, template, color = "#059669" }: ResumePreviewProps) {
  const p = data.personal;

  if (template === "modern") return <ModernTemplate data={data} color={color} />;
  if (template === "minimal") return <MinimalTemplate data={data} color={color} />;
  return <ClassicTemplate data={data} color={color} />;
}

/* ─── Classic Template ─────────────────────────────────────── */
function ClassicTemplate({ data, color }: { data: ResumeData; color: string }) {
  const p = data.personal;
  return (
    <div className="p-8 font-serif text-gray-900 text-[11px] leading-relaxed" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @media print { .resume-section { break-inside: avoid; } }
      `}</style>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-[22px] font-bold tracking-wide" style={{ color }}>{p.name || "Your Name"}</h1>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-gray-600 text-[10px] mt-1">
          {p.email && <span>{p.email}</span>}
          {p.phone && <><span>|</span><span>{p.phone}</span></>}
          {p.address && <><span>|</span><span>{p.address}</span></>}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 text-[10px] mt-1" style={{ color }}>
          {p.linkedin && <span className="underline">{p.linkedin}</span>}
          {p.github && <span className="underline">{p.github}</span>}
          {p.portfolio && <span className="underline">{p.portfolio}</span>}
        </div>
      </div>

      {p.careerObjective && (
        <Section title="Career Objective" color={color}>
          <p>{p.careerObjective}</p>
        </Section>
      )}

      {data.education.length > 0 && data.education[0].institution && (
        <Section title="Education" color={color}>
          {data.education.map((e, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-bold">{e.degree}{e.branch ? ` in ${e.branch}` : ""}</span>
                <span className="text-gray-500">{e.startYear} - {e.isCurrently ? "Present" : e.endYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="italic">{e.institution}</span>
                {e.cgpa > 0 && <span>CGPA: {e.cgpa}</span>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section title="Skills" color={color}>
          {Object.entries(
            data.skills.reduce<Record<string, string[]>>((acc, s) => {
              (acc[s.category] = acc[s.category] || []).push(`${s.name} (${s.proficiency})`);
              return acc;
            }, {})
          ).map(([cat, items]) => (
            <p key={cat}><span className="font-bold capitalize">{cat}:</span> {items.join(", ")}</p>
          ))}
        </Section>
      )}

      {data.projects.length > 0 && data.projects[0].title && (
        <Section title="Projects" color={color}>
          {data.projects.map((pr, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-bold">{pr.title}</span>
                {pr.url && <span className="underline text-[10px]" style={{ color }}>{pr.url}</span>}
              </div>
              {pr.description && <p>{pr.description}</p>}
              {pr.technologies.length > 0 && <p className="italic">Tech: {pr.technologies.join(", ")}</p>}
            </div>
          ))}
        </Section>
      )}

      {data.experience.length > 0 && data.experience[0].company && (
        <Section title="Experience" color={color}>
          {data.experience.map((e, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-bold">{e.role}</span>
                <span className="text-gray-500">{e.startDate} - {e.isCurrently ? "Present" : e.endDate}</span>
              </div>
              <p className="italic">{e.company}</p>
              {e.description && <p>{e.description}</p>}
              {e.highlights.filter(Boolean).length > 0 && (
                <ul className="list-disc ml-4 mt-1">
                  {e.highlights.filter(Boolean).map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {data.certifications.length > 0 && data.certifications[0].name && (
        <Section title="Certifications" color={color}>
          {data.certifications.map((c, i) => (
            <p key={i}>{c.name} - {c.issuer}{c.date ? ` (${c.date})` : ""}</p>
          ))}
        </Section>
      )}

      {data.languages.length > 0 && data.languages[0].name && (
        <Section title="Languages" color={color}>
          <p>{data.languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")}</p>
        </Section>
      )}

      {(data.additional.achievements || data.additional.strengths || data.additional.hobbies) && (
        <Section title="Additional" color={color}>
          {data.additional.achievements && <p><span className="font-bold">Achievements: </span>{data.additional.achievements}</p>}
          {data.additional.strengths && <p><span className="font-bold">Strengths: </span>{data.additional.strengths}</p>}
          {data.additional.hobbies && <p><span className="font-bold">Hobbies: </span>{data.additional.hobbies}</p>}
        </Section>
      )}

      {data.additional.references.length > 0 && data.additional.references[0].name && (
        <Section title="References" color={color}>
          {data.additional.references.map((r, i) => (
            <p key={i}>{r.name} - {r.title}{r.email ? ` (${r.email})` : ""}</p>
          ))}
        </Section>
      )}
    </div>
  );
}

/* ─── Modern Template ──────────────────────────────────────── */
function ModernTemplate({ data, color }: { data: ResumeData; color: string }) {
  const p = data.personal;
  return (
    <div className="flex min-h-[800px] text-[11px] leading-relaxed text-gray-800" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @media print { .resume-section { break-inside: avoid; } }
      `}</style>
      {/* Sidebar */}
      <div className="w-[220px] shrink-0 p-6 text-white" style={{ backgroundColor: color }}>
        <h1 className="text-[20px] font-bold leading-tight mb-1">{p.name || "Your Name"}</h1>
        <div className="w-12 h-0.5 bg-white/50 mb-3" />
        <div className="space-y-2 text-white/90 text-[10px]">
          {p.email && <p className="break-all">{p.email}</p>}
          {p.phone && <p>{p.phone}</p>}
          {p.address && <p>{p.address}</p>}
        </div>
        <div className="mt-4 space-y-1 text-[9px] text-white/80">
          {p.linkedin && <p className="break-all">{p.linkedin}</p>}
          {p.github && <p className="break-all">{p.github}</p>}
          {p.portfolio && <p className="break-all">{p.portfolio}</p>}
        </div>

        {data.skills.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1">Skills</h3>
            <div className="space-y-1.5">
              {data.skills.map((s, i) => (
                <div key={i}>
                  <p className="text-[10px] font-medium">{s.name}</p>
                  <div className="w-full h-1 bg-white/20 rounded-full mt-0.5">
                    <div className="h-full rounded-full bg-white/80" style={{ width: s.proficiency === "Expert" ? "100%" : s.proficiency === "Advanced" ? "75%" : s.proficiency === "Intermediate" ? "50%" : "25%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.languages.length > 0 && data.languages[0].name && (
          <div className="mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1">Languages</h3>
            <div className="space-y-1 text-[10px]">
              {data.languages.map((l, i) => (
                <p key={i}>{l.name} <span className="text-white/70">- {l.proficiency}</span></p>
              ))}
            </div>
          </div>
        )}

        {data.certifications.length > 0 && data.certifications[0].name && (
          <div className="mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1">Certifications</h3>
            <div className="space-y-1 text-[10px]">
              {data.certifications.map((c, i) => (
                <p key={i}>{c.name}<br /><span className="text-white/70">{c.issuer}</span></p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 p-6">
        {p.careerObjective && (
          <SectionModern title="Objective" color={color}>
            <p>{p.careerObjective}</p>
          </SectionModern>
        )}

        {data.education.length > 0 && data.education[0].institution && (
          <SectionModern title="Education" color={color}>
            {data.education.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between">
                  <span className="font-bold">{e.degree}{e.branch ? ` in ${e.branch}` : ""}</span>
                  <span className="text-gray-500 text-[10px]">{e.startYear} - {e.isCurrently ? "Present" : e.endYear}</span>
                </div>
                <p className="italic text-[10px]">{e.institution}{e.cgpa > 0 ? ` | CGPA: ${e.cgpa}` : ""}</p>
              </div>
            ))}
          </SectionModern>
        )}

        {data.experience.length > 0 && data.experience[0].company && (
          <SectionModern title="Experience" color={color}>
            {data.experience.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between">
                  <span className="font-bold">{e.role}</span>
                  <span className="text-gray-500 text-[10px]">{e.startDate} - {e.isCurrently ? "Present" : e.endDate}</span>
                </div>
                <p className="text-[10px] font-medium" style={{ color }}>{e.company}</p>
                {e.description && <p className="mt-1">{e.description}</p>}
                {e.highlights.filter(Boolean).length > 0 && (
                  <ul className="list-disc ml-4 mt-1 space-y-0.5">
                    {e.highlights.filter(Boolean).map((h, j) => <li key={j}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </SectionModern>
        )}

        {data.projects.length > 0 && data.projects[0].title && (
          <SectionModern title="Projects" color={color}>
            {data.projects.map((pr, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between">
                  <span className="font-bold">{pr.title}</span>
                  {pr.url && <span className="text-[9px] underline" style={{ color }}>{pr.url}</span>}
                </div>
                {pr.description && <p className="mt-0.5">{pr.description}</p>}
                {pr.technologies.length > 0 && <p className="italic text-[10px] text-gray-500 mt-0.5">Tech: {pr.technologies.join(", ")}</p>}
              </div>
            ))}
          </SectionModern>
        )}

        {(data.additional.achievements || data.additional.strengths || data.additional.hobbies) && (
          <SectionModern title="Additional" color={color}>
            {data.additional.achievements && <p><span className="font-bold">Achievements: </span>{data.additional.achievements}</p>}
            {data.additional.strengths && <p><span className="font-bold">Strengths: </span>{data.additional.strengths}</p>}
            {data.additional.hobbies && <p><span className="font-bold">Hobbies: </span>{data.additional.hobbies}</p>}
          </SectionModern>
        )}
      </div>
    </div>
  );
}

/* ─── Minimal Template ─────────────────────────────────────── */
function MinimalTemplate({ data, color }: { data: ResumeData; color: string }) {
  const p = data.personal;
  return (
    <div className="p-10 text-[11px] leading-relaxed text-gray-800" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @media print { .resume-section { break-inside: avoid; } }
      `}</style>
      <div className="mb-6">
        <h1 className="text-[24px] font-light tracking-wide text-gray-900">{p.name || "Your Name"}</h1>
        <div className="w-16 h-0.5 mt-2" style={{ backgroundColor: color }} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-gray-500">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.address && <span>{p.address}</span>}
          {p.linkedin && <span className="underline">{p.linkedin}</span>}
          {p.github && <span className="underline">{p.github}</span>}
          {p.portfolio && <span className="underline">{p.portfolio}</span>}
        </div>
      </div>

      {p.careerObjective && (
        <SectionMinimal title="Objective" color={color}>
          <p>{p.careerObjective}</p>
        </SectionMinimal>
      )}

      {data.education.length > 0 && data.education[0].institution && (
        <SectionMinimal title="Education" color={color}>
          {data.education.map((e, i) => (
            <div key={i} className="mb-3 flex justify-between">
              <div>
                <span className="font-semibold">{e.degree}{e.branch ? ` in ${e.branch}` : ""}</span>
                <span className="text-gray-500 ml-2">{e.institution}</span>
              </div>
              <span className="text-gray-400 text-[10px] shrink-0 ml-4">{e.startYear}-{e.isCurrently ? "Present" : e.endYear}{e.cgpa > 0 ? ` | ${e.cgpa} CGPA` : ""}</span>
            </div>
          ))}
        </SectionMinimal>
      )}

      {data.experience.length > 0 && data.experience[0].company && (
        <SectionMinimal title="Experience" color={color}>
          {data.experience.map((e, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between">
                <span className="font-semibold">{e.role} <span className="font-normal text-gray-500">at {e.company}</span></span>
                <span className="text-gray-400 text-[10px] shrink-0 ml-4">{e.startDate} - {e.isCurrently ? "Present" : e.endDate}</span>
              </div>
              {e.description && <p className="mt-1">{e.description}</p>}
              {e.highlights.filter(Boolean).length > 0 && (
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  {e.highlights.filter(Boolean).map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </SectionMinimal>
      )}

      {data.projects.length > 0 && data.projects[0].title && (
        <SectionMinimal title="Projects" color={color}>
          {data.projects.map((pr, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between">
                <span className="font-semibold">{pr.title}</span>
                {pr.url && <span className="text-[9px] underline text-gray-500 shrink-0 ml-4">{pr.url}</span>}
              </div>
              {pr.description && <p className="mt-0.5">{pr.description}</p>}
              {pr.technologies.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{pr.technologies.join(" / ")}</p>}
            </div>
          ))}
        </SectionMinimal>
      )}

      {data.skills.length > 0 && (
        <SectionMinimal title="Skills" color={color}>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] border" style={{ borderColor: color + "40", color }}>
                {s.name}
              </span>
            ))}
          </div>
        </SectionMinimal>
      )}

      {data.languages.length > 0 && data.languages[0].name && (
        <SectionMinimal title="Languages" color={color}>
          <p>{data.languages.map((l) => `${l.name} (${l.proficiency})`).join(" \u00B7 ")}</p>
        </SectionMinimal>
      )}

      {data.certifications.length > 0 && data.certifications[0].name && (
        <SectionMinimal title="Certifications" color={color}>
          <p>{data.certifications.map((c) => `${c.name} - ${c.issuer}`).join("; ")}</p>
        </SectionMinimal>
      )}

      {(data.additional.achievements || data.additional.strengths) && (
        <SectionMinimal title="Additional" color={color}>
          {data.additional.achievements && <p>{data.additional.achievements}</p>}
          {data.additional.strengths && <p>{data.additional.strengths}</p>}
          {data.additional.hobbies && <p>{data.additional.hobbies}</p>}
        </SectionMinimal>
      )}
    </div>
  );
}

/* ─── Shared Section Helpers ───────────────────────────────── */
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 resume-section">
      <h2 className="text-[13px] font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={{ borderColor: color, color }}>{title}</h2>
      {children}
    </div>
  );
}

function SectionModern({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 resume-section">
      <h2 className="text-[12px] font-bold uppercase tracking-wider mb-2 pb-1 border-b border-gray-200" style={{ color }}>{title}</h2>
      {children}
    </div>
  );
}

function SectionMinimal({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 resume-section">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color }}>{title}</h2>
      {children}
    </div>
  );
}
