import { RootManifestPluginEntry } from "./schema.ts";

export const contractsFolderPath = "../../contracts";
export const manifestFolderPath = "../../manifests";
export const rootManifestPath = `${manifestFolderPath}/plugins.toml`;

export function getPluginFolderPath(pluginEntry: RootManifestPluginEntry) {
  return `${manifestFolderPath}/${pluginEntry.id}`;
}

export function getPluginManifestPath(pluginEntry: RootManifestPluginEntry) {
  return `${getPluginFolderPath(pluginEntry)}/plugin.toml`;
}

export function getPluginVerionFolderPath(
  pluginEntry: RootManifestPluginEntry,
  version: string,
) {
  return `${getPluginFolderPath(pluginEntry)}/${version}`;
}

export function getPluginVerionManifestPath(
  pluginEntry: RootManifestPluginEntry,
  version: string,
) {
  return `${getPluginVerionFolderPath(pluginEntry, version)}/version.toml`;
}
