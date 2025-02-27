import { z } from "npm:zod";

const PluginIdSchema = z.string().regex(new RegExp("([a-z](_[a-z])?)+"));
const PluginNameSchema = z.string().regex(new RegExp("(\\w+( \\w+)?)+"));
const PluginKindSchema = z.enum(["App", "MediaProvider", "Transcriber"]);
const PluginVersionSchema = z.string();

export const RootManifestPluginEntrySchema = z.object({
    id: PluginIdSchema,
    name: PluginNameSchema,
    kind: PluginKindSchema
});

export const RootManifestSchema = z.object({
    plugins: z.array(RootManifestPluginEntrySchema)
});

export const PluginManifestEntrySchema = z.object({
    semver: PluginVersionSchema
});

export const PluginManifestSchema = z.object({
    id: PluginIdSchema,
    versions: z.array(PluginManifestEntrySchema)
});

export const PluginVersionManifestEntrySchema = z.object({
    url: z.string().url(),
    sha256: z.string().length(64),
    arch: z.string().regex(new RegExp("\\w+\\/\\w+"))
});

export const PluginVersionManifestSchema = z.object({
    id: PluginIdSchema,
    semver: PluginVersionSchema,
    packages: z.array(PluginVersionManifestEntrySchema)
});

export type RootManifest = z.infer<typeof RootManifestSchema>;
export type RootManifestPluginEntry = z.infer<typeof RootManifestPluginEntrySchema>;

export type PluginManifest = z.infer<typeof PluginManifestSchema>;
export type PluginManifestEntry = z.infer<typeof PluginManifestEntrySchema>;

export type PluginVersionManifest = z.infer<typeof PluginVersionManifestSchema>;
export type PluginVersionManifestEntry = z.infer<typeof PluginVersionManifestEntrySchema>;