import { mkdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const resourceBase = "https://release.botc.app/resources";
const wantedEditions = new Set(["tb", "bmr", "snv"]);
const wantedTeams = new Set(["townsfolk", "outsider", "minion", "demon"]);

const roles = await fetch(`${resourceBase}/data/roles.json`).then((response) => {
  if (!response.ok) throw new Error(`roles.json: ${response.status}`);
  return response.json();
});
const nights = await fetch(`${resourceBase}/data/nightsheet.json`).then(
  (response) => {
    if (!response.ok) throw new Error(`nightsheet.json: ${response.status}`);
    return response.json();
  },
);
const selected = roles.filter(
  (role) => wantedEditions.has(role.edition) && wantedTeams.has(role.team),
);

await mkdir(new URL("src/data/", root), { recursive: true });
await mkdir(new URL("public/characters/", root), { recursive: true });
await writeFile(
  new URL("src/data/roles.json", root),
  `${JSON.stringify(selected, null, 2)}\n`,
);
await writeFile(
  new URL("src/data/nightsheet.json", root),
  `${JSON.stringify(nights, null, 2)}\n`,
);

for (const role of selected) {
  const alignment = ["townsfolk", "outsider"].includes(role.team) ? "g" : "e";
  const directory = new URL(`public/characters/${role.edition}/`, root);
  const output = new URL(`${role.id}_${alignment}.webp`, directory);
  const response = await fetch(
    `${resourceBase}/characters/${role.edition}/${role.id}_${alignment}.webp`,
  );
  if (!response.ok) throw new Error(`${role.id}: ${response.status}`);
  await mkdir(directory, { recursive: true });
  await writeFile(output, Buffer.from(await response.arrayBuffer()));
}

await mkdir(new URL("public/characters/generic/", root), { recursive: true });
for (const id of ["minion", "demon"]) {
  const response = await fetch(`${resourceBase}/characters/generic/${id}.webp`);
  if (!response.ok) throw new Error(`generic ${id}: ${response.status}`);
  await writeFile(
    new URL(`public/characters/generic/${id}.webp`, root),
    Buffer.from(await response.arrayBuffer()),
  );
}

const ccc = await fetch(`${resourceBase}/community/ccc-sleeve.png`);
if (!ccc.ok) throw new Error(`CCC logo: ${ccc.status}`);
await writeFile(
  new URL("public/ccc-sleeve.png", root),
  Buffer.from(await ccc.arrayBuffer()),
);

console.log(`Synced ${selected.length} official characters.`);
