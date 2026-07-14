import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  Circle as CircleIcon,
  Crown,
  Eye,
  ExternalLink,
  Hand,
  Lock,
  Moon,
  Plus,
  RectangleHorizontal,
  RotateCcw,
  Share2,
  Skull,
  Sun,
  Unlock,
  UserRound,
  Users,
  Vote,
  X,
} from "lucide-react";
import officialRoles from "./data/roles.json";
import abilitiesAr from "./data/abilities-ar.json";
import "./App.css";
const officialByName = new Map(officialRoles.map((role) => [role.name, role]));
const mk = (team, s) =>
  s.split("|").map((name) => {
    const role = officialByName.get(name) || { name, team };
    const alignment = ["townsfolk", "outsider"].includes(team) ? "g" : "e";
    return {
      ...role,
      team,
      icon: `/characters/${role.edition}/${role.id}_${alignment}.webp`,
    };
  });
const scripts = {
  tb: {
    name: "Trouble Brewing",
    ar: "المتاعب تختمر",
    roles: [
      ...mk(
        "townsfolk",
        "Washerwoman|Librarian|Investigator|Chef|Empath|Fortune Teller|Undertaker|Monk|Ravenkeeper|Virgin|Slayer|Soldier|Mayor",
      ),
      ...mk("outsider", "Butler|Drunk|Recluse|Saint"),
      ...mk("minion", "Poisoner|Spy|Scarlet Woman|Baron"),
      ...mk("demon", "Imp"),
    ],
    first:
      "Minion info|Demon info|Poisoner|Washerwoman|Librarian|Investigator|Chef|Empath|Fortune Teller|Butler|Spy",
    other:
      "Poisoner|Monk|Scarlet Woman|Imp|Ravenkeeper|Empath|Fortune Teller|Undertaker|Spy",
  },
  bmr: {
    name: "Bad Moon Rising",
    ar: "قمر شؤم",
    roles: [
      ...mk(
        "townsfolk",
        "Grandmother|Sailor|Chambermaid|Exorcist|Innkeeper|Gambler|Gossip|Courtier|Professor|Minstrel|Tea Lady|Pacifist|Fool",
      ),
      ...mk("outsider", "Tinker|Moonchild|Goon|Lunatic"),
      ...mk("minion", "Godfather|Devil's Advocate|Assassin|Mastermind"),
      ...mk("demon", "Zombuul|Pukka|Shabaloth|Po"),
    ],
    first:
      "Minion info|Demon info|Grandmother|Sailor|Chambermaid|Godfather|Lunatic",
    other:
      "Sailor|Innkeeper|Courtier|Gambler|Devil's Advocate|Lunatic|Exorcist|Zombuul|Pukka|Shabaloth|Po|Assassin|Professor|Gossip|Tinker|Moonchild|Grandmother|Chambermaid",
  },
  snv: {
    name: "Sects & Violets",
    ar: "طوائف وبنفسج",
    roles: [
      ...mk(
        "townsfolk",
        "Clockmaker|Dreamer|Snake Charmer|Mathematician|Flowergirl|Town Crier|Oracle|Savant|Seamstress|Philosopher|Artist|Juggler|Sage",
      ),
      ...mk("outsider", "Mutant|Sweetheart|Barber|Klutz"),
      ...mk("minion", "Evil Twin|Witch|Cerenovus|Pit-Hag"),
      ...mk("demon", "Fang Gu|Vigormortis|No Dashii|Vortox"),
    ],
    first:
      "Minion info|Demon info|Philosopher|Snake Charmer|Evil Twin|Witch|Cerenovus|Clockmaker|Dreamer|Seamstress",
    other:
      "Philosopher|Snake Charmer|Witch|Cerenovus|Pit-Hag|Fang Gu|Vigormortis|No Dashii|Vortox|Barber|Sweetheart|Sage|Dreamer|Flowergirl|Town Crier|Oracle|Juggler|Mathematician",
  },
};
const dist = {
    5: [3, 0, 1, 1],
    6: [3, 1, 1, 1],
    7: [5, 0, 1, 1],
    8: [5, 1, 1, 1],
    9: [5, 2, 1, 1],
    10: [7, 0, 2, 1],
    11: [7, 1, 2, 1],
    12: [7, 2, 2, 1],
    13: [9, 0, 3, 1],
    14: [9, 1, 3, 1],
    15: [9, 2, 3, 1],
  },
  mix = (a) => [...a].sort(() => Math.random() - 0.5),
  base = {
    screen: "setup",
    script: "tb",
    names: [],
    players: [],
    day: 1,
    phase: "night",
    history: [],
    effects: [],
    nightInfo: {},
    savedSeats: {},
    locked: false,
    layout: "circle",
  };
export default function App() {
  const [g, setG] = useState(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("grimoire"));
        if (!saved) return base;
        const currentRoles = scripts[saved.script]?.roles || [];
        return {
          ...base,
          ...saved,
          players: (saved.players || []).map((player) => ({
            ...player,
            role:
              currentRoles.find((role) => role.name === player.role?.name) ||
              player.role,
          })),
        };
      } catch {
        return base;
      }
    }),
    [draft, setDraft] = useState(""),
    [tab, setTab] = useState("circle"),
    [sheet, setSheet] = useState(""),
    [revealed, setRevealed] = useState(null),
    [nominator, setNominator] = useState(""),
    [nominee, setNominee] = useState(""),
    [voters, setVoters] = useState([]);
  useEffect(() => localStorage.setItem("grimoire", JSON.stringify(g)), [g]);
  const s = scripts[g.script],
    alive = g.players.filter((p) => p.alive).length,
    need = Math.ceil(alive / 2);
  const todayNominations = g.history.filter((row) => row.day === g.day);
  const qualifying = todayNominations.filter((row) => row.votes >= row.need);
  const highScore = qualifying.length
    ? Math.max(...qualifying.map((row) => row.votes))
    : 0;
  const leaders = qualifying.filter((row) => row.votes === highScore);
  const onBlock = leaders.length === 1 ? leaders[0] : null;
  const votePreview =
    voters.length < need
      ? "لا يمر"
      : voters.length > highScore
        ? "المتصدّر"
        : voters.length === highScore && highScore > 0
          ? "تعادل"
          : "يمر";
  if (window.location.pathname === "/guide") return <PublicGuide />;
  function add() {
    let n = draft.trim();
    if (n && !g.names.includes(n) && g.names.length < 15) {
      setG({ ...g, names: [...g.names, n] });
      setDraft("");
    }
  }
  function start() {
    let pool = [],
      d = dist[g.names.length];
    ["townsfolk", "outsider", "minion", "demon"].forEach((t, i) =>
      pool.push(...mix(s.roles.filter((r) => r.team === t)).slice(0, d[i])),
    );
    pool = mix(pool);
    setG({
      ...g,
      screen: "game",
      players: g.names.map((name, i) => ({
        id: crypto.randomUUID(),
        name,
        role: pool[i],
        alive: true,
        ghost: true,
        note: "",
        pos: g.savedSeats?.[name],
      })),
      day: 1,
      phase: "night",
      history: [],
      effects: [],
      nightInfo: {},
      locked: Boolean(g.savedSeats && Object.keys(g.savedSeats).length),
      layout: g.layout || "circle",
    });
  }
  const patch = (id, x) =>
    setG((current) => ({
      ...current,
      players: current.players.map((p) => (p.id === id ? { ...p, ...x } : p)),
    }));
  function saveVote() {
    let target = g.players.find((p) => p.id === nominee);
    let source = g.players.find((p) => p.id === nominator);
    if (!target || !source || !source.alive || g.phase !== "day") return;
    if (todayNominations.some((row) => row.nominatorId === source.id)) return;
    if (todayNominations.some((row) => row.nomineeId === target.id)) return;
    setG({
      ...g,
      players: g.players.map((p) =>
        voters.includes(p.id) && !p.alive ? { ...p, ghost: false } : p,
      ),
      history: [
        {
          id: crypto.randomUUID(),
          day: g.day,
          name: target.name,
          nomineeId: target.id,
          nominator: source.name,
          nominatorId: source.id,
          votes: voters.length,
          need,
          voterIds: [...voters],
          voterNames: g.players
            .filter((player) => voters.includes(player.id))
            .map((player) => player.name),
        },
        ...g.history,
      ],
    });
    setVoters([]);
    setNominator("");
    setNominee("");
    setSheet("");
  }
  function finishDay() {
    setG((current) => ({
      ...current,
      players: current.players.map((player) =>
        onBlock && player.id === onBlock.nomineeId
          ? { ...player, alive: false }
          : player,
      ),
      phase: "night",
      day: current.day + 1,
    }));
    setSheet("");
  }
  function addEffect(effect) {
    setG((current) => ({
      ...current,
      effects: [
        ...(current.effects || []),
        { ...effect, id: crypto.randomUUID(), day: current.day },
      ],
    }));
  }
  function removeEffect(id) {
    setG((current) => ({
      ...current,
      effects: (current.effects || []).filter((effect) => effect.id !== id),
    }));
  }
  function saveNightInfo(roleId, info) {
    setG((current) => ({
      ...current,
      nightInfo: { ...(current.nightInfo || {}), [roleId]: info },
    }));
  }
  return (
    <main dir="rtl">
      <div className="grain" />
      {g.screen === "setup" ? (
        <section className="setup">
          <div className="crest">
            <Crown />
          </div>
          <small>STORYTELLER’S GRIMOIRE</small>
          <h1>دفتر الراوي</h1>
          <p>أدر اللعبة كاملة من تلفونك، بدون أوراق ضايعة.</p>
          <a className="public-guide-link" href="/guide" target="_blank">
            <BookOpen /> دليل اللاعبين العام <ExternalLink />
          </a>
          <div className="card">
            <label>اختر السكربت</label>
            <div className="scripts">
              {Object.entries(scripts).map(([id, x]) => (
                <button
                  key={id}
                  className={g.script === id ? "on" : ""}
                  onClick={() => setG({ ...g, script: id })}
                >
                  <b>{x.ar}</b>
                  <span>{x.name}</span>
                </button>
              ))}
            </div>
            <header>
              <label>اللاعبون</label>
              <em>{g.names.length} / 15</em>
            </header>
            <div className="entry">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="اكتب اسم اللاعب"
              />
              <button onClick={add}>
                <Plus />
              </button>
            </div>
            <div className="chips">
              {g.names.map((n, i) => (
                <span key={n}>
                  {i + 1}. {n}
                  <X
                    onClick={() =>
                      setG({ ...g, names: g.names.filter((x) => x !== n) })
                    }
                  />
                </span>
              ))}
            </div>
            <button
              className="start"
              disabled={!dist[g.names.length]}
              onClick={start}
            >
              وزّع الأدوار وابدأ
            </button>
          </div>
          <footer>
            <Check /> الجلسة تُحفظ تلقائياً على هذا الجهاز
          </footer>
        </section>
      ) : (
        <>
          <header className="top">
            <div>
              <small>{s.name}</small>
              <h1>دفتر الراوي</h1>
            </div>
            <button
              onClick={() =>
                g.phase === "night"
                  ? setG({ ...g, phase: "day" })
                  : setSheet("endday")
              }
            >
              {g.phase === "night" ? <Moon /> : <Sun />}
              {g.phase === "night" ? `الليلة ${g.day}` : `اليوم ${g.day}`}
            </button>
          </header>
          <button className="reset" onClick={() => setSheet("reset")}>
            <RotateCcw />
          </button>
          <section className="content">
            {tab === "circle" && (
              <Circle
                players={g.players}
                patch={patch}
                phase={g.phase}
                locked={Boolean(g.locked)}
                layout={g.layout || "circle"}
                effects={g.effects || []}
                removeEffect={removeEffect}
                setRoom={(change) =>
                  setG((current) => ({ ...current, ...change }))
                }
              />
            )}{" "}
            {tab === "players" && (
              <Players
                players={g.players}
                roles={s.roles}
                patch={patch}
                onReveal={setRevealed}
              />
            )}{" "}
            {tab === "guide" && (
              <Guide
                roles={s.roles}
                script={s}
                history={g.history}
                openLog={() => setTab("log")}
              />
            )}{" "}
            {tab === "log" && <Log rows={g.history} />}
          </section>
          <nav>
            <button
              className={tab === "circle" ? "on" : ""}
              onClick={() => setTab("circle")}
            >
              <UserRound />
              الدائرة
            </button>
            <button
              className={tab === "players" ? "on" : ""}
              onClick={() => setTab("players")}
            >
              <Users />
              اللاعبون
            </button>
            <button
              className="vote"
              disabled={g.phase !== "day"}
              onClick={() => setSheet("vote")}
            >
              <Vote />
              تصويت
            </button>
            <button onClick={() => setSheet("night")}>
              <Moon />
              الليل
            </button>
            <button
              className={["guide", "log"].includes(tab) ? "on" : ""}
              onClick={() => setTab("guide")}
            >
              <BookOpen />
              الدليل
            </button>
          </nav>
        </>
      )}
      {sheet && (
        <Modal
          title={
            sheet === "vote"
              ? "الترشيح والتصويت"
              : sheet === "night"
                ? "ترتيب الليل"
                : sheet === "endday"
                  ? "إنهاء اليوم"
                  : "لعبة جديدة"
          }
          close={() => setSheet("")}
        >
          {sheet === "vote" ? (
            <>
              {onBlock ? (
                <div className="on-block">
                  <Skull />
                  <span>
                    <small>على منصة الإعدام حالياً</small>
                    <b>
                      {onBlock.name} — {onBlock.votes} أصوات
                    </b>
                  </span>
                </div>
              ) : leaders.length > 1 ? (
                <div className="on-block tie">
                  <Vote />
                  <span>
                    <small>تعادل في أعلى الأصوات</small>
                    <b>لا يوجد إعدام حالياً</b>
                  </span>
                </div>
              ) : null}
              <label>من يرشّح؟</label>
              <select
                className="select"
                value={nominator}
                onChange={(e) => setNominator(e.target.value)}
              >
                <option value="">اختر لاعباً حياً…</option>
                {g.players
                  .filter(
                    (p) =>
                      p.alive &&
                      !todayNominations.some((row) => row.nominatorId === p.id),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <label>المرشّح للإعدام</label>
              <select
                className="select"
                value={nominee}
                onChange={(e) => setNominee(e.target.value)}
              >
                <option value="">اختر لاعباً…</option>
                {g.players
                  .filter(
                    (p) =>
                      !todayNominations.some((row) => row.nomineeId === p.id),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.alive ? "" : " (ميت)"}
                    </option>
                  ))}
              </select>
              <div className="score">
                <span>
                  الأصوات<b>{voters.length}</b>
                </span>
                <span>
                  المطلوب<b>{need}</b>
                </span>
                <span className={voters.length >= need ? "pass" : ""}>
                  النتيجة<b>{votePreview}</b>
                </span>
              </div>
              <label>اضغط على من رفع يده</label>
              <div className="voters">
                {g.players.map((p) => (
                  <button
                    key={p.id}
                    disabled={!p.alive && !p.ghost}
                    className={voters.includes(p.id) ? "on" : ""}
                    onClick={() =>
                      setVoters(
                        voters.includes(p.id)
                          ? voters.filter((x) => x !== p.id)
                          : [...voters, p.id],
                      )
                    }
                  >
                    {p.alive ? <UserRound /> : <Skull />}
                    <b>{p.name}</b>
                    {!p.alive && (
                      <small>{p.ghost ? "صوت ميت" : "استُخدم"}</small>
                    )}
                  </button>
                ))}
              </div>
              <button
                className="confirm"
                disabled={!nominator || !nominee}
                onClick={saveVote}
              >
                سجّل التصويت
              </button>
            </>
          ) : sheet === "night" ? (
            <Night
              order={(g.day === 1 ? s.first : s.other).split("|")}
              players={g.players}
              first={g.day === 1}
              effects={g.effects || []}
              nightInfo={g.nightInfo || {}}
              addEffect={addEffect}
              removeEffect={removeEffect}
              saveNightInfo={saveNightInfo}
            />
          ) : sheet === "endday" ? (
            <div className="end-day">
              {onBlock ? (
                <>
                  <Skull />
                  <h3>سيُعدم {onBlock.name}</h3>
                  <p>حصل على {onBlock.votes} أصوات، وهو المتصدر بدون تعادل.</p>
                </>
              ) : (
                <>
                  <Moon />
                  <h3>لن يُعدم أحد</h3>
                  <p>
                    {leaders.length > 1
                      ? "هناك تعادل في أعلى الأصوات."
                      : "لم يحصل أي مرشح على الحد المطلوب."}
                  </p>
                </>
              )}
              <button className="confirm" onClick={finishDay}>
                ثبّت النتيجة وانتقل إلى الليل
              </button>
            </div>
          ) : (
            <div className="new">
              <p>ماذا تريد أن تفعل بأسماء اللاعبين؟</p>
              <button
                onClick={() => {
                  const savedSeats = Object.fromEntries(
                    g.players
                      .filter((player) => player.pos)
                      .map((player) => [player.name, player.pos]),
                  );
                  setG({
                    ...base,
                    script: g.script,
                    names: g.names,
                    savedSeats,
                    layout: g.layout || "circle",
                  });
                  setSheet("");
                }}
              >
                <Users />
                <b>احتفظ بالأسماء</b>
              </button>
              <button
                onClick={() => {
                  setG({ ...base, script: g.script });
                  setSheet("");
                }}
              >
                <X />
                <b>امسح كل شيء</b>
              </button>
            </div>
          )}
        </Modal>
      )}
      {revealed && (
        <RoleReveal player={revealed} close={() => setRevealed(null)} />
      )}
    </main>
  );
}
function Circle({
  players,
  patch,
  phase,
  locked,
  layout,
  effects,
  removeEffect,
  setRoom,
}) {
  const board = useRef(null);
  const drag = useRef(null);
  const positionFor = (kind, index, count) => {
    if (kind === "circle") {
      const angle = (index / count) * Math.PI * 2;
      return { x: 50 + 39 * Math.sin(angle), y: 50 - 39 * Math.cos(angle) };
    }
    const t = (index / count) * 4;
    const side = Math.floor(t);
    const part = t - side;
    const low = 10;
    const high = 90;
    if (side === 0) return { x: low + part * (high - low), y: low };
    if (side === 1) return { x: high, y: low + part * (high - low) };
    if (side === 2) return { x: high - part * (high - low), y: high };
    return { x: low, y: high - part * (high - low) };
  };
  const arrange = (kind) => {
    players.forEach((player, index) =>
      patch(player.id, { pos: positionFor(kind, index, players.length) }),
    );
    setRoom({ layout: kind });
  };
  const pointerDown = (player, event) => {
    if (locked) return;
    drag.current = {
      id: player.id,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event) => {
    if (!drag.current || locked) return;
    if (
      Math.hypot(
        event.clientX - drag.current.startX,
        event.clientY - drag.current.startY,
      ) > 5
    )
      drag.current.moved = true;
    const rect = board.current.getBoundingClientRect();
    const x = Math.max(
      7,
      Math.min(93, ((event.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      7,
      Math.min(93, ((event.clientY - rect.top) / rect.height) * 100),
    );
    patch(drag.current.id, { pos: { x, y } });
  };
  const pointerUp = (player) => {
    if (!drag.current) {
      if (locked) patch(player.id, { alive: !player.alive });
      return;
    }
    if (!drag.current.moved) patch(player.id, { alive: !player.alive });
    drag.current = null;
  };
  return (
    <>
      {effects.length > 0 && (
        <section className="effect-tray">
          <header>
            <b>تذكيرات الراوي</b>
            <span>{effects.length}</span>
          </header>
          <div>
            {effects.map((effect) => (
              <button
                key={effect.id}
                className={effect.tone}
                onClick={() => removeEffect(effect.id)}
                aria-label={`إزالة ${effect.marker} عن ${effect.targetName}`}
              >
                <span>{effect.marker}</span>
                <b>{effect.targetName}</b>
                <small>{effect.sourceRole}</small>
                <X />
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="layout-tools">
        <div>
          <button
            className={layout === "circle" ? "on" : ""}
            onClick={() => arrange("circle")}
          >
            <CircleIcon /> دائري
          </button>
          <button
            className={layout === "rectangle" ? "on" : ""}
            onClick={() => arrange("rectangle")}
          >
            <RectangleHorizontal /> مستطيل
          </button>
        </div>
        <button
          className={locked ? "locked" : ""}
          onClick={() => setRoom({ locked: !locked })}
        >
          {locked ? <Lock /> : <Unlock />}
          {locked ? "مقفول" : "حرّك اللاعبين"}
        </button>
      </div>
      <div
        ref={board}
        className={`circle board-${layout} ${locked ? "board-locked" : ""}`}
        onPointerMove={pointerMove}
      >
        <div className="center">
          {phase === "night" ? <Moon /> : <Sun />}
          <small>{phase}</small>
        </div>
        {players.map((p, i) => {
          const pos = p.pos || positionFor(layout, i, players.length);
          const playerEffects = effects.filter(
            (effect) => effect.targetId === p.id,
          );
          return (
            <button
              key={p.id}
              className={`token placed ${p.role.team} ${p.alive ? "" : "dead"}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onPointerDown={(event) => pointerDown(p, event)}
              onPointerUp={() => pointerUp(p)}
            >
              <i>
                {p.alive ? (
                  <img src={p.role.icon} alt="" draggable="false" />
                ) : (
                  <Skull />
                )}
                {!p.alive && p.ghost && <Hand />}
              </i>
              <b>{p.name}</b>
              <small>{p.role.name}</small>
              {p.note?.trim() && <span className="token-note">{p.note}</span>}
              {playerEffects.map((effect) => (
                <span
                  key={effect.id}
                  className={`token-effect ${effect.tone}`}
                >
                  {effect.marker}
                </span>
              ))}
            </button>
          );
        })}
      </div>
      <p className="move-hint">
        {locked
          ? "المقاعد مقفولة. افتح القفل لتعديل أماكن الجلوس."
          : "اسحب كل لاعب إلى مكانه الحقيقي، ثم اقفل الترتيب."}
      </p>
    </>
  );
}
function Players({ players, roles, patch, onReveal }) {
  return (
    <div className="people">
      <h2>اللاعبون والأدوار</h2>
      {players.map((p) => (
        <article key={p.id}>
          <i className={p.role.team}>
            {p.alive ? <img src={p.role.icon} alt={p.role.name} /> : <Skull />}
          </i>
          <section>
            <b>{p.name}</b>
            <select
              value={p.role.name}
              onChange={(e) =>
                patch(p.id, {
                  role: roles.find((r) => r.name === e.target.value),
                })
              }
            >
              {roles.map((r) => (
                <option key={r.id}>{r.name}</option>
              ))}
            </select>
            <p className="player-ability">
              {abilitiesAr[p.role.id] || p.role.ability}
            </p>
            <input
              value={p.note}
              onChange={(e) => patch(p.id, { note: e.target.value })}
              placeholder="أضف ملاحظة…"
            />
          </section>
          <button onClick={() => patch(p.id, { alive: !p.alive })}>
            {p.alive ? "حي" : "ميت"}
          </button>
          <button className="reveal-role" onClick={() => onReveal(p)}>
            <Eye /> اعرض الدور
          </button>
          {!p.alive && (
            <button
              className="ghost"
              onClick={() => patch(p.id, { ghost: !p.ghost })}
            >
              <Hand />
              {p.ghost ? "صوته متاح" : "صوته استُخدم"}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
function RoleReveal({ player, close }) {
  return (
    <section className={`role-reveal ${player.role.team}`}>
      <button className="reveal-close" onClick={close} aria-label="إغلاق">
        <X />
      </button>
      <div className="reveal-content">
        <span className="reveal-label">دورك يا</span>
        <h1>{player.name}</h1>
        <div className="reveal-token">
          <img src={player.role.icon} alt={player.role.name} />
        </div>
        <span className="reveal-team">{teamNames[player.role.team]}</span>
        <h2>{player.role.name}</h2>
        <div className="reveal-rule">
          <BookOpen />
          <p>{abilitiesAr[player.role.id] || player.role.ability}</p>
        </div>
        <p className="reveal-warning">احفظ دورك ولا توري الشاشة لأحد</p>
      </div>
    </section>
  );
}
const teamNames = {
  townsfolk: "أهل البلدة",
  outsider: "الغرباء",
  minion: "الأتباع",
  demon: "الشياطين",
};
function Guide({ roles, script, history = [], openLog, publicView = false }) {
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const shareGuide = async () => {
    const url = `${window.location.origin}/guide`;
    if (navigator.share) {
      await navigator.share({ title: "دليل Blood on the Clocktower", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };
  const visible =
    filter === "all" ? roles : roles.filter((r) => r.team === filter);
  return (
    <div className="guide-page">
      <header className="guide-head">
        <div>
          <small>{script.name}</small>
          <h2>دليل الشخصيات</h2>
        </div>
        <div className="guide-actions">
          {!publicView && (
            <button onClick={openLog}>
              <Vote /> سجل التصويت ({history.length})
            </button>
          )}
          <button onClick={shareGuide}>
            <Share2 /> {copied ? "تم نسخ الرابط" : "شارك الدليل"}
          </button>
        </div>
      </header>
      <div className="rule-note">
        <BookOpen />
        <p>
          النص الموجود على بطاقة الشخصية هو المرجع الأساسي. علامة النجمة تعني أن
          القدرة لا تعمل في الليلة الأولى.
        </p>
      </div>
      <div className="guide-filters">
        <button
          className={filter === "all" ? "on" : ""}
          onClick={() => setFilter("all")}
        >
          الكل
        </button>
        {Object.entries(teamNames).map(([id, label]) => (
          <button
            key={id}
            className={filter === id ? "on" : ""}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="role-guide">
        {visible.map((role) => (
          <article key={role.id} className={role.team}>
            <i>
              <img src={role.icon} alt="" />
            </i>
            <section>
              <header>
                <b>{role.name}</b>
                <span>{teamNames[role.team]}</span>
              </header>
              <p>{abilitiesAr[role.id] || role.ability}</p>
              {role.setup && <em>هذه الشخصية تغيّر إعداد اللعبة.</em>}
            </section>
          </article>
        ))}
      </div>
      <footer className="ccc">
        <img src="/ccc-sleeve.png" alt="Community Created Content" />
        <span>أداة مجتمعية غير رسمية</span>
      </footer>
    </div>
  );
}
function PublicGuide() {
  const [scriptId, setScriptId] = useState("tb");
  const script = scripts[scriptId];
  return (
    <main className="public-guide" dir="rtl">
      <div className="grain" />
      <header className="public-guide-hero">
        <a href="/">دفتر الراوي</a>
        <span>دليل اللاعبين</span>
        <h1>
          تعلّم الشخصيات
          <br />
          قبل أن تدق الساعة
        </h1>
        <p>
          مرجع عام بدون أي معلومات عن اللعبة الحالية. اختر السكربت واقرأ قدرة كل
          شخصية وصورتها.
        </p>
      </header>
      <section className="public-rules">
        <h2>فكرة اللعبة بسرعة</h2>
        <p>
          فريق الخير يحاول معرفة الشيطان وإعدامه. فريق الشر يضلل البلدة ويحمي
          الشيطان. تتعاقب الليالي والنهارات، وفي النهار يتناقش اللاعبون ويرشّحون
          ويصوّتون.
        </p>
        <div>
          <span>
            <b>الحي</b> يرشّح ويصوّت
          </span>
          <span>
            <b>الميت</b> يملك صوتاً أخيراً واحداً
          </span>
          <span>
            <b>الفوز</b> بإعدام الشيطان أو وصول الشر لنهايته
          </span>
        </div>
      </section>
      <section className="public-guide-body">
        <div className="public-script-picker">
          {Object.entries(scripts).map(([id, item]) => (
            <button
              key={id}
              className={scriptId === id ? "on" : ""}
              onClick={() => setScriptId(id)}
            >
              <b>{item.ar}</b>
              <small>{item.name}</small>
            </button>
          ))}
        </div>
        <Guide roles={script.roles} script={script} publicView />
      </section>
    </main>
  );
}
function Log({ rows }) {
  const [expanded, setExpanded] = useState("");
  return (
    <div className="log">
      <h2>سجل الترشيحات</h2>
      {rows.length ? (
        rows.map((r) => (
          <article key={r.id} className={expanded === r.id ? "open" : ""}>
            <button
              className="log-summary"
              onClick={() => setExpanded(expanded === r.id ? "" : r.id)}
              aria-expanded={expanded === r.id}
            >
              <span>اليوم {r.day}</span>
              <b>{r.nominator ? `${r.nominator} ← ${r.name}` : r.name}</b>
              <em className={r.votes >= r.need ? "pass" : ""}>
                {r.votes} / {r.need}
              </em>
            </button>
            {expanded === r.id && (
              <section className="vote-details">
                <small>صوّتوا مع الترشيح</small>
                {r.voterNames ? (
                  r.voterNames.length ? (
                    <div>
                      {r.voterNames.map((name) => (
                        <span key={name}>{name}</span>
                      ))}
                    </div>
                  ) : (
                    <p>لم يصوّت أحد مع هذا الترشيح.</p>
                  )
                ) : (
                  <p>تفاصيل المصوّتين غير محفوظة لهذا التصويت القديم.</p>
                )}
              </section>
            )}
          </article>
        ))
      ) : (
        <p>كل تصويت تسجله سيظهر هنا.</p>
      )}
    </div>
  );
}
function Modal({ title, close, children }) {
  return (
    <div className="back">
      <section className="modal">
        <header>
          <h2>{title}</h2>
          <button onClick={close}>
            <X />
          </button>
        </header>
        <div>{children}</div>
      </section>
    </div>
  );
}
const nightSpecials = {
  "Minion info": {
    icon: "/characters/generic/minion.webp",
    reminder:
      "إذا كان عدد اللاعبين 7 أو أكثر: أيقظ جميع الأتباع، ودعهم يتعرفون على بعضهم، ثم أشر لهم إلى الشيطان.",
  },
  "Demon info": {
    icon: "/characters/generic/demon.webp",
    reminder:
      "إذا كان عدد اللاعبين 7 أو أكثر: عرّف الشيطان على أتباعه، ثم اعرض عليه 3 شخصيات طيبة غير موجودة في اللعب لاستخدامها كخدعة.",
  },
};
const nightActions = {
  poisoner: { label: "سمّم لاعباً", marker: "مسموم", tone: "poison" },
  monk: { label: "احمِ لاعباً", marker: "محمي", tone: "protect" },
  butler: { label: "اختر السيد", marker: "سيد Butler", tone: "info" },
  sailor: { label: "سجّل الاختيار", marker: "اختيار Sailor", tone: "info" },
  innkeeper: {
    label: "احمِ لاعباً",
    marker: "محمي من Innkeeper",
    tone: "protect",
  },
  devilsadvocate: {
    label: "احمِ من الإعدام",
    marker: "محمي من الإعدام",
    tone: "protect",
  },
  exorcist: {
    label: "اختر الشيطان",
    marker: "اختيار Exorcist",
    tone: "info",
  },
  pukka: { label: "سمّم لاعباً", marker: "مسموم من Pukka", tone: "poison" },
  witch: { label: "العن لاعباً", marker: "ملعون", tone: "danger" },
  cerenovus: {
    label: "اختر لاعباً",
    marker: "تأثير Cerenovus",
    tone: "danger",
  },
  pithag: { label: "سجّل الهدف", marker: "تغيير Pit-Hag", tone: "danger" },
  snakecharmer: {
    label: "سجّل الاختيار",
    marker: "اختيار Snake Charmer",
    tone: "info",
  },
};
const startingInfoTeams = {
  washerwoman: "townsfolk",
  librarian: "outsider",
  investigator: "minion",
};
function Night({
  order,
  players,
  first,
  effects,
  nightInfo,
  addEffect,
  removeEffect,
  saveNightInfo,
}) {
  const [targets, setTargets] = useState({});
  const [customTarget, setCustomTarget] = useState("");
  const [customMarker, setCustomMarker] = useState("");
  const [openInfo, setOpenInfo] = useState("");
  let inPlay = new Map(players.map((p) => [p.role.name, p]));
  const randomFrom = (list) =>
    list.length ? list[Math.floor(Math.random() * list.length)] : null;
  const prepareStartingInfo = (role, source, keepTruth = false) => {
    const team = startingInfoTeams[role.id];
    const previous = nightInfo[role.id];
    const previousTruth = players.find(
      (candidate) => candidate.id === previous?.truthId,
    );
    const truth =
      keepTruth && previousTruth?.role.team === team
        ? previousTruth
        : randomFrom(
            players.filter(
              (candidate) =>
                candidate.id !== source.id && candidate.role.team === team,
            ),
          );
    if (!truth) {
      saveNightInfo(role.id, { sourceId: source.id, zero: true });
      setOpenInfo(role.id);
      return;
    }
    const decoyPool = players.filter(
      (candidate) =>
        candidate.id !== source.id && candidate.id !== truth.id,
    );
    const freshDecoyPool =
      keepTruth && decoyPool.length > 1
        ? decoyPool.filter(
            (candidate) => candidate.id !== previous?.decoyId,
          )
        : decoyPool;
    const decoy = randomFrom(freshDecoyPool);
    saveNightInfo(role.id, {
      sourceId: source.id,
      truthId: truth.id,
      decoyId: decoy?.id,
    });
    setOpenInfo(role.id);
  };
  return (
    <div className="night">
      {effects.length > 0 && (
        <section className="night-reminders">
          <header>
            <b>تذكيرات فعّالة</b>
            <small>تبقى ظاهرة إلى أن تشيلها</small>
          </header>
          {effects.map((effect) => (
            <button
              key={effect.id}
              onClick={() => removeEffect(effect.id)}
            >
              <span>{effect.marker}</span>
              <b>{effect.targetName}</b>
              <small>{effect.sourceRole}</small>
              <X />
            </button>
          ))}
        </section>
      )}
      <details className="custom-reminder">
        <summary>أضف تذكيراً يدوياً</summary>
        <div>
          <select
            value={customTarget}
            onChange={(event) => setCustomTarget(event.target.value)}
            aria-label="لاعب التذكير اليدوي"
          >
            <option value="">اختر اللاعب…</option>
            {players.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}{target.alive ? "" : " (ميت)"}
              </option>
            ))}
          </select>
          <input
            value={customMarker}
            onChange={(event) => setCustomMarker(event.target.value)}
            placeholder="مثلاً: مسموم حتى الغد"
            aria-label="نص التذكير اليدوي"
          />
          <button
            disabled={!customTarget || !customMarker.trim()}
            onClick={() => {
              const target = players.find(
                (candidate) => candidate.id === customTarget,
              );
              if (!target) return;
              addEffect({
                sourceId: "manual",
                sourceName: "الراوي",
                sourceRole: "تذكير يدوي",
                targetId: target.id,
                targetName: target.name,
                marker: customMarker.trim(),
                tone: "info",
              });
              setCustomTarget("");
              setCustomMarker("");
            }}
          >
            أضف
          </button>
        </div>
      </details>
      {order.map((r, i) => {
        const player = inPlay.get(r);
        const special = nightSpecials[r];
        const specialActive = Boolean(special && players.length >= 7);
        const role = player?.role || officialByName.get(r);
        const action = player && nightActions[role?.id];
        const canPrepareInfo = Boolean(
          first && player && startingInfoTeams[role?.id],
        );
        const savedInfo = canPrepareInfo && nightInfo[role.id];
        const savedTruth = players.find(
          (candidate) => candidate.id === savedInfo?.truthId,
        );
        const savedDecoy = players.find(
          (candidate) => candidate.id === savedInfo?.decoyId,
        );
        const hasEligibleTruth = players.some(
          (candidate) =>
            candidate.id !== player?.id &&
            candidate.role.team === startingInfoTeams[role?.id],
        );
        const infoIsCurrent = Boolean(
          savedInfo &&
            savedInfo.sourceId === player?.id &&
            (savedInfo.zero
              ? role.id === "librarian" && !hasEligibleTruth
              : savedTruth?.role.team === startingInfoTeams[role.id] &&
                savedDecoy &&
                savedDecoy.id !== player.id &&
                savedDecoy.id !== savedTruth.id),
        );
        const preparedInfo = infoIsCurrent ? savedInfo : null;
        const truth = infoIsCurrent ? savedTruth : null;
        const decoy = infoIsCurrent ? savedDecoy : null;
        return (
          <article key={r} className={player || specialActive ? "in" : ""}>
            <span>{i + 1}</span>
            {(role || special) && (
              <img
                src={
                  special?.icon ||
                  role.icon ||
                  `/characters/${role.edition}/${role.id}_${["townsfolk", "outsider"].includes(role.team) ? "g" : "e"}.webp`
                }
                alt=""
              />
            )}
            <section>
              <b>{r}</b>
              {player && <em>{player.name}</em>}
              {(player || specialActive) && (
                <p>
                  {special?.reminder ||
                    abilitiesAr[role.id] ||
                    (first ? role.firstNightReminder : role.otherNightReminder)}
                </p>
              )}
              {canPrepareInfo && (
                <>
                  <button
                    className="night-info-trigger"
                    onClick={() => {
                      if (!preparedInfo) {
                        prepareStartingInfo(role, player);
                      } else {
                        setOpenInfo(openInfo === role.id ? "" : role.id);
                      }
                    }}
                  >
                    <span>
                      {preparedInfo
                        ? "افتح معلومة البداية"
                        : "جهّز معلومة البداية"}
                    </span>
                    <small>{preparedInfo ? "جاهزة" : "اختيار تلقائي"}</small>
                  </button>
                  {openInfo === role.id && preparedInfo && (
                    <section className="starting-info-card">
                      {preparedInfo.zero ? (
                        <div className="zero-info">
                          <b>لا يوجد Outsider في هذه اللعبة</b>
                          <p>أعطِ إشارة الرقم صفر للـLibrarian.</p>
                        </div>
                      ) : truth && decoy ? (
                        <>
                          <header>
                            <img src={truth.role.icon} alt={truth.role.name} />
                            <div>
                              <small>الشخصية التي تعرضها</small>
                              <b>{truth.role.name}</b>
                            </div>
                          </header>
                          <p>اعرض صورة الشخصية، ثم أشر إلى هذين اللاعبين:</p>
                          <div className="info-pair">
                            <span>
                              <small>الحقيقي</small>
                              <b>{truth.name}</b>
                            </span>
                            <i>أو</i>
                            <span>
                              <small>تمويه</small>
                              <b>{decoy.name}</b>
                            </span>
                          </div>
                          <button
                            className="reroll-decoy"
                            onClick={() =>
                              prepareStartingInfo(role, player, true)
                            }
                          >
                            غيّر اسم التمويه
                          </button>
                        </>
                      ) : (
                        <p>تعذّر تجهيز المعلومة. جرّب مرة ثانية.</p>
                      )}
                    </section>
                  )}
                </>
              )}
              {action && (
                <div className="night-action">
                  <select
                    value={targets[role.id] || ""}
                    onChange={(event) =>
                      setTargets({
                        ...targets,
                        [role.id]: event.target.value,
                      })
                    }
                    aria-label={`${action.label} بواسطة ${r}`}
                  >
                    <option value="">{action.label}…</option>
                    {players.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}{target.alive ? "" : " (ميت)"}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!targets[role.id]}
                    onClick={() => {
                      const target = players.find(
                        (candidate) => candidate.id === targets[role.id],
                      );
                      if (!target) return;
                      addEffect({
                        sourceId: player.id,
                        sourceName: player.name,
                        sourceRole: role.name,
                        targetId: target.id,
                        targetName: target.name,
                        marker: action.marker,
                        tone: action.tone,
                      });
                      setTargets({ ...targets, [role.id]: "" });
                    }}
                  >
                    سجّل
                  </button>
                </div>
              )}
            </section>
          </article>
        );
      })}
      <p>الأدوار المضيئة موجودة في هذه اللعبة.</p>
    </div>
  );
}
