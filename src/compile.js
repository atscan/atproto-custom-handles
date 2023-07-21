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
  return v ? "✅" : "❌";
}
function _person(v) {
  return v.did ? `[${v.name}](https://bsky.app/profile/${v})` : v.name;
}
function _links(v) {
  return Object.keys(v).map((k) => `[${k}](${v[k]})`).join(", ");
}
function _handles(v) {
    return v.map(h => `\`.${h}\``).join("<br>")
}

const cols = [
  ["Handles", "handles", _handles],
  ["Free?", "paid", _bool],
  ["Open?", "inviteOnly", _bool],
  ["Auth", "auth"],
  ["Maintainer", "maintainer", _person],
  ["Links", "links", _links],
];

const ln = [
  "| " + cols.map((c) => c[0]).join(" | ") + " |",
  "| " + cols.map((c) => "---").join(" | ") + " |",
];
for (const item of data) {
  let map = (c) => {
    const val = item[c[1]];
    return c[2] ? c[2](val) : val;
  };
  ln.push("| " + cols.map(map).join(" | ") + " |");
}

const output = readme.replace("@@TABLE@@", ln.join("\n"));

await Deno.writeTextFile("./README.md", output);
console.log("Done, README.md written");
