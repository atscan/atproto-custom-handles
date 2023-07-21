import { parse, stringify } from "https://deno.land/std@0.194.0/yaml/mod.ts";
import Ajv from "npm:ajv";
import addFormats from "npm:ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = parse(await Deno.readTextFile("./src/schema.yaml"));
const data = parse(await Deno.readTextFile("./src/data.yaml"));
const readme = await Deno.readTextFile("./src/README.md");

const validate = ajv.compile(schema);
const valid = validate(data);
if (!valid) {
  console.log("Schema error:", validate.errors);
  Deno.exit(1);
}

function _bool(v) {
  return v ? "✅" : (v === false ? "❌" : "-");
}
function _sbool(v) {
  return v ? "✅" : "-";
}
function _person(v) {
  return v.did ? `[${v.name}](https://bsky.app/profile/${v.did})` : v.name;
}
function _links(v) {
  return Object.keys(v).map((k) => `[${k}](${v[k]})`).join(", ");
}
function _handles(v) {
  return v.map((h) => `\`*.${h}\``).join("<br>");
}
function table(items, cols) {
  const dummyLn = () => "|" + cols.map((c) => "---").join("|") + "|";
  const ln = [
    "| " + cols.map((c) => c[0]).join(" | ") + " |",
    dummyLn(),
  ];
  for (const item of items) {
    let map = (c) => {
      const val = item[c[1]]?.trim ? item[c[1]].trim() : item[c[1]];
      return c[2] ? c[2](val) : val;
    };
    ln.push("| " + cols.map(map).join(" | ") + " |");
  }
  return ln.join("\n");
}

let output = readme;

const cols = [
  ["Handles", "handles", _handles],
  ["Type", "type"],
  ["PDS?", "isPds", _sbool],
  ["Open?", "inviteOnly", (v) => _bool(!v)],
  ["Free?", "paid", (v) => _bool(!v)],
  ["Auth", "auth"],
  ["Maintainer", "maintainer", _person],
  ["Links", "links", _links],
];
output = output.replace(
  "@@TABLE@@",
  table(data.filter((i) => !i.unofficial), cols),
);

const colsUo = [
  ["Handles", "handles", _handles],
  ["Type", "type"],
  ["Open?", "inviteOnly", (v) => _bool(!v)],
  ["Auth", "auth"],
  ["Maintainer", "maintainer", _person],
  ["Links", "links", _links],
  ["Note", "note"],
];
output = output.replace(
  "@@TABLE_UNOFFICIAL@@",
  table(data.filter((i) => i.unofficial), colsUo),
);

output = output.replace(
  "@@LAST_UPDATE@@",
  new Date().toISOString(),
);

await Deno.writeTextFile("./README.md", output);
console.log("Done, README.md written");
