import assert from "node:assert";
import { test } from "node:test";
import Parser from "tree-sitter";

test("can load and parse the packaged grammar", async () => {
  const parser = new Parser();
  await assert.doesNotReject(async () => {
    const { default: language } = await import("./index.js");
    parser.setLanguage(language);
    const tree = parser.parse("scratch identity(values: f32s) -> f32s:\n  values\n");
    assert.equal(tree.rootNode.hasError, false);
  });
});
