# Self-hosted fonts

Inter 400-700 (latin, vietnamese) and Sora 600-700 (latin, latin-ext), woff2, SIL Open Font License 1.1
(licenses in `inter/OFL.txt` and `sora/OFL.txt`). Loaded through `packages/ui/src/fonts.css`; apps import it from
their root layout. No request goes to Google Fonts.

Source: the woff2 files of the npm packages below, extracted from the registry tarballs (not installed as dependencies).

| Package | Version | Tarball integrity (registry) |
|---|---|---|
| @fontsource/inter | 5.3.0 | sha512-RofMylZmjlJEfELXeNHFWBRcSs75rGU/6bV2S2jfnvv/3rPXPGe0LgUJTklcHZ9lM4OZmAVFhcJPnACfb91A3g== |
| @fontsource/sora | 5.3.0 | sha512-SqW3OpKxxfKvxDLPlbdrWf2KooPfbd+W3jaYn483o+Y/JrmU87vjFPNptDqwP428c3vY+gnranLhjcbRaXB0Jw== |

To refresh: `npm pack @fontsource/<name>@<version>`, compare the integrity, copy the same files, update this table.
