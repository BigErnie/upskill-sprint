# Grade Specification Lookup source assets

This directory stores compressed, base64-encoded source HTML for the Grade Specification Lookup and its user guide.

The source files were taken from the uploaded package `grade_spec_lookup_with_user_guide(5).zip` and verified before integration.

| Source | Compression | Verified uncompressed SHA-256 |
|---|---|---|
| `grade_spec_lookup.html.br.b64.part-01` | Brotli, then base64 | `93184e755a496d5d973bf5b2c164c72be8a4c97fecd66b213234d0de96a1e6eb` |
| `grade_spec_lookup_user_guide.html.gz.b64` | Gzip, then base64 | `9b9246bfe5bf96ed4b2335b60b4efeff21de973900b9d506b57fdbdf4cad992f` |

Run the deterministic build with:

```bash
node scripts/build-grade-specification-lookup.mjs
```

The build script verifies both hashes before creating:

- `engineering-tools/grade-specification-lookup/index.html`
- `engineering-tools/grade-specification-lookup/how-to-use/index.html`

The output directory is removed and recreated on each build so old loaders, fragments, wrappers, or stale generated files cannot survive deployment.
