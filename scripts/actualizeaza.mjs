// Completează secțiunile automate din README.md cu paginile publice ale aplicabilai.ro.
// Rulare: node scripts/actualizeaza.mjs [cale-sau-url]   (implicit https://aplicabilai.ro/date/pagini.json)
import { readFileSync, writeFileSync } from "node:fs";

const SURSA = process.argv[2] || "https://aplicabilai.ro/date/pagini.json";
const date = SURSA.startsWith("http")
  ? await (await fetch(SURSA, { headers: { "user-agent": "awesome-ai-romana-sync" } })).json()
  : JSON.parse(readFileSync(SURSA, "utf8"));
const pagini = date.pagini || [];
if (pagini.length < 20) throw new Error("Export gol sau invalid");

const eIndex = (p) => new URL(p.url).pathname.split("/").filter(Boolean).length < 2;
const sectiune = (s) => pagini.filter((p) => p.sectiune === s && !eIndex(p)).sort((a, b) => a.titlu.localeCompare(b.titlu, "ro"));
const scurt = (t) => (t || "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
const lista = (arr) => arr.map((p) => `- [${p.titlu}](${p.url}) – ${scurt(p.descriere)}.`).join("\n");

const blocuri = {
  ghiduri: lista(sectiune("ghid")),
  unelte: lista(sectiune("unelte")),
  glosar: sectiune("glosar").map((p) => `[${p.titlu}](${p.url})`).join(" · "),
  prompturi:
    "Pe meserii, cu buton de copiere: " +
    sectiune("prompturi").map((p) => `[${p.titlu.replace(/^Prompturi ChatGPT pentru /, "").replace(/, în română$/, "")}](${p.url})`).join(" · ") +
    ".",
};

let readme = readFileSync("README.md", "utf8");
for (const [cheie, continut] of Object.entries(blocuri)) {
  const re = new RegExp(`(<!-- auto:${cheie}:start -->)[\\s\\S]*?(<!-- auto:${cheie}:end -->)`);
  if (!re.test(readme)) throw new Error(`Lipsește marcajul auto:${cheie}`);
  readme = readme.replace(re, `$1\n${continut}\n$2`);
}
writeFileSync("README.md", readme);
console.log("OK:", Object.fromEntries(Object.entries(blocuri).map(([k, v]) => [k, v.split(/\n| · /).length])));
