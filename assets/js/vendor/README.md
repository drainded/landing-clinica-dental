# Librerías de terceros

## three-dentadura.min.js

- **Librería**: three.js **0.186.1** (MIT, ver `LICENSE-three.txt`), paquete npm `three@0.186.1`, código sin modificar.
- **Contenido**: bundle ESM recortado y minificado (≈ 626 KB crudos / ≈ 160 KB gzip) con solo lo que usa `js/dentadura.js`:
  `WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Mesh, Group, Vector2, Vector3, Color, MathUtils, BackSide`,
  `GLTFLoader` (con sus dependencias `BufferGeometryUtils` y `SkeletonUtils`) y `MeshoptDecoder`.
- Se genera **una sola vez** con esbuild (herramienta de desarrollo; el sitio no tiene build). No se ejecuta en el despliegue.

### Archivo de entrada (`entrada.js`)

```js
export { WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Mesh, Group, Vector2, Vector3, Color, MathUtils, BackSide } from './x/package/build/three.module.js';
export { GLTFLoader } from './x/package/examples/jsm/loaders/GLTFLoader.js';
export { MeshoptDecoder } from './x/package/examples/jsm/libs/meshopt_decoder.module.js';
```

### Cómo regenerarlo

En un directorio temporal **fuera del repositorio**:

```sh
npm pack three@0.186.1
mkdir x && tar -xzf three-0.186.1.tgz -C x      # queda en x/package
npm init -y && npm i esbuild@0.25.10
# crear entrada.js con el contenido de arriba
npx esbuild entrada.js --bundle --minify --format=esm \
  --alias:three=./x/package/build/three.module.js \
  --legal-comments=none \
  --outfile=<repo>/assets/js/vendor/three-dentadura.min.js
```

`--alias:three=…` hace que el `import … from 'three'` de `GLTFLoader` apunte al mismo `three.module.js` (que a su vez importa `three.core.js`), de modo que no haya dos copias de three.
