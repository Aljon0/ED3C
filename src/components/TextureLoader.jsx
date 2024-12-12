// components/TextureLoader.js
import { useState, useEffect } from "react";
import * as THREE from "three";

const TextureLoader = ({ url }) => {
  const [texture, setTexture] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (loadedTexture) => setTexture(loadedTexture),
      undefined,
      (err) => setError(err)
    );
  }, [url]);

  return error ? null : texture;
};

export default TextureLoader;