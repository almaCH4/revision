"use client";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

const SUBJECTS = [
  { id: "maths", name: "Maths", e: "📐", c: "bg-blue-500" },
  { id: "fr", name: "Français", e: "📖", c: "bg-rose-500" },
  { id: "en", name: "English Lit", e: "🎭", c: "bg-purple-500" },
  { id: "hist", name: "Histoire", e: "🏛️", c: "bg-amber-500" },
  { id: "geo", name: "Géographie", e: "🌍", c: "bg-emerald-500" },
  { id: "svt", name: "SVT", e: "🧬", c: "bg-green-600" },
  { id: "pc", name: "Physique-Chimie", e: "⚗️", c: "bg-cyan-600" },
  { id: "es", name: "Espagnol (DELE)", e: "🇪🇸", c: "bg-orange-500" },
  { id: "bia", name: "BIA", e: "✈️", c: "bg-sky-500" },
];
const sub = (id: string) => SUBJECTS.find((s) => s.id === id) || SUBJECTS[0];
const TYPES = ["Comprendre", "Apprendre", "Réviser", "Devoir"];
const LVL = ["Je ne comprends pas", "Je comprends", "Je maîtrise"];

type Step = { t: string; d: boolean };
type Task = { id: string; title: string; sub: string; type: string; due: string; done: boolean; steps: Step[] };
type Item = { id: string; sub: string; kind: "note" | "lien" | "q"; a: string; b: string; lvl: number; next: number };
type Data = { tasks: Task[]; items: Item[]; dele: string; bia: string };

const uid = () => Math.random().toString(36).slice(2, 9);
const DEF: Data = {
  dele: "2026-11-20",
  bia: "",
  tasks: [
    { id: "ex1", title: "Exemple : comprendre un chapitre de physique-chimie", sub: "pc", type: "Comprendre", due: "2026-10-12",
      done: false, steps: [{ t: "Lire le titre et les mots en gras (2 min)", d: false }, { t: "Écrire une question sur ce que je ne comprends pas", d: false }] },
  ],
  items: [
    { id: "ex2", sub: "es", kind: "q", a: "Exemple : « tener » au présent, première personne ?", b: "tengo", lvl: 0, next: 0 },
    { id: "ex3", sub: "en", kind: "note", a: "Exemple : Things Fall Apart", b: "Thèmes : tradition, changement, masculinité.", lvl: 0, next: 0 },
  ],
};

const left = (d: string) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null);
const fmt = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const card = "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700";
const btn = "min-h-[44px] rounded-xl px-4 py-2 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const main = `${btn} bg-indigo-600 text-white hover:bg-indigo-700`;
const soft = `${btn} bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100`;
const inp = "min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800";

function Focus({ t, onClose, onDone }: { t: Task; onClose: () => void; onDone: () => void }) {
  const [min, setMin] = useState(25);
  const [s, setS] = useState(25 * 60);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    const i = setInterval(() => setS((x) => x - 1), 1000);
    return () => clearInterval(i);
  }, [run]);
  useEffect(() => { if (s <= 0) setRun(false); }, [s]);
  const pick = (m: number) => { setMin(m); setS(m * 60); setRun(false); };
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-50 p-6 text-center dark:bg-slate-900">
      <p className="text-sm text-slate-500">{sub(t.sub).e} {sub(t.sub).name}</p>
      <h2 className="max-w-md text-2xl font-bold">{t.title}</h2>
      <div className="text-7xl font-bold tabular-nums">{fmt(s)}</div>
      {s <= 0 && <p className="font-semibold text-emerald-600">Session terminée. Bien joué !</p>}
      <div className="flex gap-2">
        {[10, 25, 45].map((m) => (
          <button key={m} onClick={() => pick(m)} className={min === m ? main : soft}>{m} min</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRun(!run)} className={main}>{run ? "Pause" : s < min * 60 ? "Reprendre" : "Démarrer"}</button>
        <button onClick={onDone} className={soft}>Fait ✅</button>
        <button onClick={onClose} className={soft}>Fermer</button>
      </div>
    </div>
  );
}

export default function Page() {
  const [d, setD] = useState<Data>(DEF);
  const [ok, setOk] = useState(false);
  const [tab, setTab] = useState("today");
  const [focus, setFocus] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", sub: "maths", type: "Comprendre", due: "" });
  const [sel, setSel] = useState<string | null>(null);
  const [kind, setKind] = useState<"note" | "lien" | "q">("note");
  const [fa, setFa] = useState("");
  const [fb, setFb] = useState("");
  const [flip, setFlip] = useState(false);
  const [flt, setFlt] = useState("all");

  useEffect(() => {
    try { const s = localStorage.getItem("mer-data"); if (s) setD(JSON.parse(s)); } catch {}
    setOk(true);
  }, []);
  useEffect(() => { if (ok) localStorage.setItem("mer-data", JSON.stringify(d)); }, [d, ok]);
  if (!ok) return <main className="p-6">Chargement…</main>;

  const upT = (id: string, fn: (t: Task) => Task) => setD((x) => ({ ...x, tasks: x.tasks.map((t) => (t.id === id ? fn(t) : t)) }));
  const open = d.tasks.filter((t) => !t.done).sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));
  const next = open[0];
  const ft = d.tasks.find((t) => t.id === focus);

  const addTask = () => {
    if (!f.title.trim()) return;
    setD((x) => ({ ...x, tasks: [...x.tasks, { id: uid(), ...f, title: f.title.trim(), done: false, steps: [] }] }));
    setF({ ...f, title: "" });
  };
  const addItem = () => {
    if (!sel || !fa.trim()) return;
    setD((x) => ({ ...x, items: [{ id: uid(), sub: sel, kind, a: fa.trim(), b: fb.trim(), lvl: 0, next: 0 }, ...x.items] }));
    setFa(""); setFb("");
  };
  const upI = (id: string, fn: (i: Item) => Item) => setD((x) => ({ ...x, items: x.items.map((i) => (i.id === id ? fn(i) : i)) }));
  const delI = (id: string) => setD((x) => ({ ...x, items: x.items.filter((i) => i.id !== id) }));

  const Steps = ({ t }: { t: Task }) => (
    <div className="mt-3 space-y-2">
      {t.steps.map((s, i) => (
        <label key={i} className="flex min-h-[44px] items-center gap-3">
          <input type="checkbox" className="h-5 w-5" checked={s.d}
            onChange={() => upT(t.id, (z) => ({ ...z, steps: z.steps.map((y, j) => (j === i ? { ...y, d: !y.d } : y)) }))} />
          <span className={s.d ? "text-slate-400 line-through" : ""}>{s.t}</span>
        </label>
      ))}
      <input className={inp} placeholder="Ajouter une micro-étape (Entrée)"
        onKeyDown={(e) => {
          const v = e.currentTarget.value.trim();
          if (e.key === "Enter" && v) { upT(t.id, (z) => ({ ...z, steps: [...z.steps, { t: v, d: false }] })); e.currentTarget.value = ""; }
        }} />
    </div>
  );

  const Count = ({ label, date }: { label: string; date: string }) => {
    const n = left(date);
    return (
      <div className={`${card} flex-1 text-center`}>
        <div className="text-3xl font-bold">{n === null ? "—" : Math.max(0, n)}</div>
        <div className="text-sm text-slate-500">jours avant {label}</div>
      </div>
    );
  };

  const due = d.items.filter((i) => i.kind === "q" && i.next <= Date.now() && (flt === "all" || i.sub === flt));
  const c = due[0];
  const rate = (days: number, lvl: number) => { if (c) upI(c.id, (i) => ({ ...i, lvl, next: Date.now() + days * 864e5 })); setFlip(false); };

  const exp = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: "application/json" }));
    a.download = "revision.json";
    a.click();
  };
  const imp = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) file.text().then((s) => { try { setD(JSON.parse(s)); } catch { alert("Fichier invalide."); } });
  };

  const tabs: [string, string, string][] = [["today", "🏠", "Aujourd'hui"], ["plan", "🗓️", "Planning"], ["subj", "📚", "Matières"], ["rev", "🃏", "Réviser"], ["set", "⚙️", "Réglages"]];

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4 pb-28">
      {ft && <Focus t={ft} onClose={() => setFocus(null)} onDone={() => { upT(ft.id, (z) => ({ ...z, done: true })); setFocus(null); }} />}

      {tab === "today" && (
        <>
          <h1 className="text-2xl font-bold">Aujourd&apos;hui</h1>
          <div className="flex gap-3"><Count label="le DELE" date={d.dele} /><Count label="le BIA" date={d.bia} /></div>
          {next ? (
            <section className={`${card} border-l-8 ${sub(next.sub).c.replace("bg-", "border-")}`}>
              <p className="text-sm text-slate-500">Ma prochaine action · {sub(next.sub).e} {sub(next.sub).name}{next.due ? ` · pour le ${next.due}` : ""}</p>
              <h2 className="mt-1 text-xl font-bold">{next.title}</h2>
              <Steps t={next} />
              <button className={`${main} mt-4 w-full`} onClick={() => setFocus(next.id)}>Commencer</button>
            </section>
          ) : (
            <section className={card}>Rien à faire pour l&apos;instant. Ajoute une tâche dans Planning.</section>
          )}
          {open.length > 1 && (
            <details className={card}>
              <summary className="min-h-[44px] cursor-pointer font-semibold">Voir la suite ({Math.min(3, open.length - 1)})</summary>
              <ul className="mt-2 space-y-2">
                {open.slice(1, 4).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span>{sub(t.sub).e} {t.title}</span>
                    <button className={soft} onClick={() => setFocus(t.id)}>Focus</button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {tab === "plan" && (
        <>
          <h1 className="text-2xl font-bold">Planning</h1>
          <section className={`${card} space-y-2`}>
            <input className={inp} placeholder="Nouvelle tâche" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className={inp} value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })}>{SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className={inp} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            <input type="date" className={inp} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
            <button className={`${main} w-full`} onClick={addTask}>Ajouter la tâche</button>
          </section>
          {[...d.tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.due || "9").localeCompare(b.due || "9")).map((t) => {
            const n = left(t.due);
            return (
              <section key={t.id} className={`${card} ${t.done ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="h-6 w-6" checked={t.done} onChange={() => upT(t.id, (z) => ({ ...z, done: !z.done }))} />
                  <div className="flex-1">
                    <div className={`font-semibold ${t.done ? "line-through" : ""}`}>{t.title}</div>
                    <div className={`text-sm ${n !== null && n < 0 && !t.done ? "text-red-600" : "text-slate-500"}`}>
                      {sub(t.sub).e} {t.type}{t.due ? ` · ${t.due}${n !== null && n < 0 && !t.done ? " (en retard)" : n === 0 ? " (aujourd'hui)" : ""}` : ""}
                    </div>
                  </div>
                  <button className={soft} aria-label="Supprimer" onClick={() => setD((x) => ({ ...x, tasks: x.tasks.filter((z) => z.id !== t.id) }))}>🗑️</button>
                </div>
                {!t.done && <Steps t={t} />}
              </section>
            );
          })}
        </>
      )}

      {tab === "subj" && !sel && (
        <>
          <h1 className="text-2xl font-bold">Matières</h1>
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS.map((s) => (
              <button key={s.id} onClick={() => setSel(s.id)} className={`${card} text-left`}>
                <div className={`mb-2 h-2 w-12 rounded-full ${s.c}`} />
                <div className="text-2xl">{s.e}</div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-slate-500">{d.items.filter((i) => i.sub === s.id).length} éléments</div>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === "subj" && sel && (
        <>
          <button className={soft} onClick={() => setSel(null)}>← Matières</button>
          <h1 className="text-2xl font-bold">{sub(sel).e} {sub(sel).name}</h1>
          <div className="flex gap-2">
            {([["note", "Notes"], ["lien", "Liens"], ["q", "Questions"]] as const).map(([k, l]) => (
              <button key={k} className={kind === k ? main : soft} onClick={() => setKind(k)}>{l}</button>
            ))}
          </div>
          <section className={`${card} space-y-2`}>
            <input className={inp} placeholder={kind === "q" ? "Question" : kind === "lien" ? "Titre du lien" : "Titre de la note"} value={fa} onChange={(e) => setFa(e.target.value)} />
            <textarea className={inp} rows={3} placeholder={kind === "q" ? "Réponse" : kind === "lien" ? "https://… (Drive, slides, PDF)" : "Texte"} value={fb} onChange={(e) => setFb(e.target.value)} />
            <button className={`${main} w-full`} onClick={addItem}>Ajouter</button>
          </section>
          {d.items.filter((i) => i.sub === sel && i.kind === kind).map((i) => (
            <section key={i.id} className={card}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{kind === "lien" ? <a className="text-indigo-600 underline" href={i.b} target="_blank" rel="noreferrer">{i.a}</a> : i.a}</div>
                <button className={soft} aria-label="Supprimer" onClick={() => delI(i.id)}>🗑️</button>
              </div>
              {kind === "note" && <p className="mt-2 whitespace-pre-wrap">{i.b}</p>}
              {kind === "q" && (
                <>
                  <details className="mt-2"><summary className="min-h-[44px] cursor-pointer">Voir la réponse</summary><p className="whitespace-pre-wrap">{i.b}</p></details>
                  <button className={`${soft} mt-2`} onClick={() => upI(i.id, (z) => ({ ...z, lvl: (z.lvl + 1) % 3 }))}>{LVL[i.lvl]}</button>
                </>
              )}
            </section>
          ))}
        </>
      )}

      {tab === "rev" && (
        <>
          <h1 className="text-2xl font-bold">Réviser</h1>
          <select className={inp} value={flt} onChange={(e) => { setFlt(e.target.value); setFlip(false); }}>
            <option value="all">Toutes les matières</option>
            {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {c ? (
            <section className={`${card} space-y-4 text-center`}>
              <p className="text-sm text-slate-500">{sub(c.sub).e} {sub(c.sub).name} · {due.length} à revoir</p>
              <h2 className="text-xl font-bold">{c.a}</h2>
              {flip ? (
                <>
                  <p className="whitespace-pre-wrap text-lg">{c.b || "(pas de réponse écrite)"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button className={soft} onClick={() => rate(1, 0)}>Raté</button>
                    <button className={soft} onClick={() => rate(3, 1)}>Moyen</button>
                    <button className={main} onClick={() => rate(7, 2)}>Facile</button>
                  </div>
                </>
              ) : (
                <button className={`${main} w-full`} onClick={() => setFlip(true)}>Voir la réponse</button>
              )}
            </section>
          ) : (
            <section className={card}>Plus de carte à revoir. Ajoute des questions dans Matières.</section>
          )}
          <section className={card}>
            <h3 className="font-bold">Je bloque</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Relire le titre</li><li>Écrire ce que je comprends</li><li>Écrire ma question précise</li>
              <li>L&apos;ajouter dans Questions</li><li>Chercher un exemple</li><li>Demander à un prof ou à un ami</li>
            </ol>
          </section>
        </>
      )}

      {tab === "set" && (
        <>
          <h1 className="text-2xl font-bold">Réglages</h1>
          <section className={`${card} space-y-2`}>
            <label className="block">Date du DELE<input type="date" className={inp} value={d.dele} onChange={(e) => setD({ ...d, dele: e.target.value })} /></label>
            <label className="block">Date du BIA<input type="date" className={inp} value={d.bia} onChange={(e) => setD({ ...d, bia: e.target.value })} /></label>
          </section>
          <section className={`${card} space-y-2`}>
            <button className={`${main} w-full`} onClick={exp}>Exporter mes données</button>
            <label className="block">Importer mes données<input type="file" accept="application/json" className={inp} onChange={imp} /></label>
            <button className={`${soft} w-full`} onClick={() => setD((x) => ({ ...x, tasks: x.tasks.filter((t) => !t.id.startsWith("ex")), items: x.items.filter((i) => !i.id.startsWith("ex")) }))}>Supprimer les exemples</button>
            <button className={`${soft} w-full`} onClick={() => { if (confirm("Tout effacer ?")) setD({ ...DEF, tasks: [], items: [] }); }}>Tout réinitialiser</button>
          </section>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 p-1 dark:border-slate-700 dark:bg-slate-800/95">
        {tabs.map(([k, e, l]) => (
          <button key={k} onClick={() => { setTab(k); setSel(null); }} aria-label={l}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center rounded-xl text-xs ${tab === k ? "bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200" : "text-slate-500"}`}>
            <span className="text-xl">{e}</span>{l}
          </button>
        ))}
      </nav>
    </main>
  );
}
