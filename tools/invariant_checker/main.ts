import { compare, parse as parseSemver } from "jsr:@std/semver";
import { parse as parseToml } from "jsr:@std/toml";
import { assert, assertEquals } from "@std/assert";
import { kebabCase } from "npm:change-case";
import {
  ContractManifest,
  ContractManifestSchema,
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
  contractsFolderPath,
} from "./paths.ts";

async function checkRepoInvariant() {
  const contractVersions = new Map<string, string[]>();

  for await (const file of Deno.readDir(contractsFolderPath)) {
    if (!file.isFile) continue;
    const contractManifest = ContractManifestSchema.parse(
      parseToml(await Deno.readTextFile(`${contractsFolderPath}/${file.name}`))
    );
    contractVersions.set(
      contractManifest.id,
      await checkContract(file, contractManifest)
    );
  }

  const rootManifest = RootManifestSchema.parse(
    parseToml(await Deno.readTextFile(rootManifestPath))
  );

  const idsArray = rootManifest.plugins.map((p) => p.id);
  const idsSet = new Set(idsArray);
  assertEquals(
    idsArray.length,
    idsSet.size,
    "Duplicate plugin ids are not allowed."
  );

  const idsArrayOrdered = idsArray.toSorted();
  assertEquals(
    idsArray,
    idsArrayOrdered,
    "Plugins must be ordered by their id."
  );

  rootManifest.plugins.forEach((pluginEntry) => {
    console.log(`Validating "${pluginEntry.id}" plugin`);
    assert(
      contractVersions.get(pluginEntry.kind) !== undefined,
      `No contract versions found for kind ${pluginEntry.kind}`
    );
    checkPlugin(pluginEntry, contractVersions.get(pluginEntry.kind)!);
  });
}

async function checkPlugin(
  pluginEntry: RootManifestPluginEntry,
  contractEntries: string[]
) {
  const pluginManifest = PluginManifestSchema.parse(
    parseToml(await Deno.readTextFile(getPluginManifestPath(pluginEntry)))
  );
  assertEquals(
    pluginManifest.id,
    pluginEntry.id,
    formatError("Plugin id must match plugin list entry.", pluginEntry)
  );
  assert(
    pluginEntry.id.startsWith(
      getPluginKindFolderRepresentation(pluginEntry.kind)
    ),
    formatError("Plugin id must start with plugin kind.", pluginEntry)
  );

  const versionsArray = pluginManifest.versions.map((v) =>
    parseSemver(v.semver)
  );
  const verionsSet = new Set(versionsArray);
  assertEquals(
    versionsArray.length,
    verionsSet.size,
    formatError("Duplicate versions are not allowed.", pluginEntry)
  );

  const versionsArrayOrdered = versionsArray.toSorted(
    (a, b) => compare(a, b) * -1
  );
  assertEquals(
    versionsArray,
    versionsArrayOrdered,
    formatError("Versions must be ordered in descending order.", pluginEntry)
  );

  pluginManifest.versions.forEach((versionEntry) => {
    checkPluginVersion(pluginEntry, versionEntry.semver, contractEntries);
  });
}

async function checkPluginVersion(
  pluginEntry: RootManifestPluginEntry,
  version: string,
  contractVersions: string[]
) {
  const pluginVersionManifest = PluginVersionManifestSchema.parse(
    parseToml(
      await Deno.readTextFile(getPluginVerionManifestPath(pluginEntry, version))
    )
  );
  assertEquals(
    pluginVersionManifest.id,
    pluginEntry.id,
    formatError(
      "Plugin version id must match plugin list entry.",
      pluginEntry,
      version
    )
  );
  assertEquals(
    pluginVersionManifest.semver,
    version,
    formatError(
      "Plugin version must match plugin version list entry.",
      pluginEntry,
      version
    )
  );

  assert(
    contractVersions.includes(pluginVersionManifest.contract_semver),
    formatError("Plugin contract semver doesn't exist", pluginEntry, version)
  );

  const packageArray = pluginVersionManifest.packages.map((p) => p.arch);
  const packageSet = new Set(packageArray);
  assertEquals(
    packageArray.length,
    packageSet.size,
    formatError("Only one package per arch is allowed.", pluginEntry, version)
  );

  pluginVersionManifest.packages.forEach((packageEntry) => {
    assert(
      packageEntry.url.endsWith(".tar.gz"),
      formatError(
        "Only packages in the tar.gz format are accepted.",
        pluginEntry,
        version,
        packageEntry.arch
      )
    );
  });
}

async function checkContract(
  file: Deno.DirEntry,
  contractManifest: ContractManifest
): Promise<string[]> {
  console.log(`Validating "${contractManifest.id}" contract`);
  assertEquals(file.name.replace(".toml", ""), kebabCase(contractManifest.id));

  const versionsArray = contractManifest.versions.map((p) => p.semver);
  const versionsSet = new Set(versionsArray);
  assertEquals(
    versionsArray.length,
    versionsSet.size,
    "Duplicate versions are not allowed."
  );

  const versionsArrayOrdered = versionsArray.toSorted();
  assertEquals(
    versionsArray,
    versionsArrayOrdered,
    "Versions must be ordered."
  );

  for (const version of contractManifest.versions) {
    assert(
      (
        await fetch(
          `https://raw.githubusercontent.com/openspaeher/wit/${
            version.commit
          }/${kebabCase(contractManifest.id)}.wit`
        )
      ).status === 200,
      `Unable to get contract definition for contract version ${version.semver}`
    );
  }

  return versionsArray;
}

function formatError(
  text: string,
  pluginEntry: RootManifestPluginEntry,
  version?: string,
  arch?: string
) {
  return `${pluginEntry.id}${version == null ? "" : `@${version}`}${
    arch == null ? "" : ` ${arch}`
  }: ${text}`;
}

if (import.meta.main) {
  await checkRepoInvariant();
  console.log("Successfully validated manifest invariants");
}
