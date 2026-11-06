# LCP source

The public LCP page is generated from `model2.mjs` and `build2.mjs`. The drawing toolkit needed by the generator is included under `vendor/anatomy/` with its MIT license. The generated page includes the model and drawing code inline.

To regenerate the light page and insert the site's navigation:

```sh
node source/lcp/build2.mjs --light
python3 source/lcp/apply_to_site.py source/lcp/lcp-three-channels-light.html
```

The intermediate generated file is ignored by Git. To verify that the generated page and navigation match the committed site page without changing it:

```sh
node source/lcp/build2.mjs --light
python3 source/lcp/apply_to_site.py source/lcp/lcp-three-channels-light.html --check
```

Run `node source/lcp/model2.mjs` for the default model's per-grant calculations. See the [model notes](../../prototype/lab/lcp/notes.md) for the example and its limits.
