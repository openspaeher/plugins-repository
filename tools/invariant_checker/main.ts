import { compare, parse as parseSemver } from "jsr:@std/semver";
import { parse as parseToml } from "jsr:@std/toml";
import { assert, assertEquals } from "@std/assert";
import {
  PluginManifestSchema,
  PluginVersionManifestSchema,
  RootManifestPluginEntry,
  RootManifestSchema,
} from "./schema.ts";
import {
  getPluginKindFolderRepresentation,
  getPluginManifestPath,
  getPluginVerionManifestPath,
  rootManifestPath,
} from "./paths.ts";

async function checkRepoInvariant() {
  const rootManifest = RootManifestSchema.parse(
    parseToml(await Deno.readTextFile(rootManifestPath)),
  );

  const idsArray = rootManifest.plugins.map((p) => p.id);
  const idsSet = new Set(idsArray);
  assertEquals(
    idsArray.length,
    idsSet.size,
    "Duplicate plugin ids are not allowed.",
  );

  const idsArrayOrdered = idsArray.toSorted();
  assertEquals(
    idsArray,
    idsArrayOrdered,
    "Plugins must be ordered by their id.",
  );

  rootManifest.plugins.forEach((pluginEntry) => {
    console.log(`Validating "${pluginEntry.id}" plugin`);
    checkPlugin(pluginEntry);
  });
}

async function checkPlugin(pluginEntry: RootManifestPluginEntry) {
  const pluginManifest = PluginManifestSchema.parse(
    parseToml(await Deno.readTextFile(getPluginManifestPath(pluginEntry))),
  );
  assertEquals(
    pluginManifest.id,
    pluginEntry.id,
    formatError("Plugin id must match plugin list entry.", pluginEntry),
  );
  assert(
    pluginEntry.id.startsWith(
      getPluginKindFolderRepresentation(pluginEntry.kind),
    ),
    formatError("Plugin id must start with plugin kind.", pluginEntry),
  );

  const versionsArray = pluginManifest.versions.map((v) =>
    parseSemver(v.semver)
  );
  const verionsSet = new Set(versionsArray);
  assertEquals(
    versionsArray.length,
    verionsSet.size,
    formatError("Duplicate versions are not allowed.", pluginEntry),
  );

  const versionsArrayOrdered = versionsArray.toSorted((a, b) =>
    compare(a, b) * -1
  );
  assertEquals(
    versionsArray,
    versionsArrayOrdered,
    formatError("Versions must be ordered in descending order.", pluginEntry),
  );

  pluginManifest.versions.forEach((versionEntry) => {
    checkPluginVersion(pluginEntry, versionEntry.semver);
  });
}

async function checkPluginVersion(
  pluginEntry: RootManifestPluginEntry,
  version: string,
) {
  const pluginVersionManifest = PluginVersionManifestSchema.parse(
    parseToml(
      await Deno.readTextFile(
        getPluginVerionManifestPath(pluginEntry, version),
      ),
    ),
  );
  assertEquals(
    pluginVersionManifest.id,
    pluginEntry.id,
    formatError(
      "Plugin version id must match plugin list entry.",
      pluginEntry,
      version,
    ),
  );
  assertEquals(
    pluginVersionManifest.semver,
    version,
    formatError(
      "Plugin version must match plugin version list entry.",
      pluginEntry,
      version,
    ),
  );

  const packageArray = pluginVersionManifest.packages.map((p) => p.arch);
  const packageSet = new Set(packageArray);
  assertEquals(
    packageArray.length,
    packageSet.size,
    formatError("Only one package per arch is allowed.", pluginEntry, version),
  );

  pluginVersionManifest.packages.forEach((packageEntry) => {
    assert(
      packageEntry.url.endsWith(".tar.gz"),
      formatError(
        "Only packages in the tar.gz format are accepted.",
        pluginEntry,
        version,
        packageEntry.arch,
      ),
    );
  });
}

function formatError(
  text: string,
  pluginEntry: RootManifestPluginEntry,
  version?: string,
  arch?: string,
) {
  return `${pluginEntry.id}${version == null ? "" : `@${version}`}${
    arch == null ? "" : ` ${arch}`
  }: ${text}`;
}

if (import.meta.main) {
  await checkRepoInvariant();
  console.log("Successfully validated manifest invariants");
}
