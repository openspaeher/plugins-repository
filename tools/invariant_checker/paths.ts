import { RootManifestPluginEntry } from "./schema.ts";

export const manifestFolderPath = "../../manifests"
export const rootManifestPath = `${manifestFolderPath}/plugins.toml`

function getPluginKindFolderRepresentation(kind: "App" | "MediaProvider" | "Transcriber"): string {
    switch(kind) {
        case "App": return "apps"
        case "MediaProvider": return "media_providers"
        case "Transcriber": return "transcribers"
    }
}

export function getPluginFolderPath(pluginEntry: RootManifestPluginEntry) {
  return `${manifestFolderPath}/${getPluginKindFolderRepresentation(pluginEntry.kind)}/${pluginEntry.id}`
}

export function getPluginManifestPath(pluginEntry: RootManifestPluginEntry) {
  return `${getPluginFolderPath(pluginEntry)}/plugin.toml`;
}

export function getPluginVerionFolderPath(pluginEntry: RootManifestPluginEntry, version: string) {
  return `${getPluginFolderPath(pluginEntry)}/${version}`
}

export function getPluginVerionManifestPath(pluginEntry: RootManifestPluginEntry, version: string) {
  return `${getPluginVerionFolderPath(pluginEntry, version)}/version.toml`;
}