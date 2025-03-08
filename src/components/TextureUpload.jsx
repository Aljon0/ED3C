import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { notifySuccess, notifyError } from "../general/CustomToast.js";

function TextureUpload() {
  const [textures, setTextures] = useState([]);
  const [uploadingTexture, setUploadingTexture] = useState(false);

  useEffect(() => {
    fetchTextures();
  }, []);

  const fetchTextures = async () => {
    try {
      const texturesRef = ref(storage, 'textureImages');
      const texturesList = await listAll(texturesRef);
      
      const texturesData = await Promise.all(
        texturesList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const name = item.name.split('.')[0]; 
          return {
            name,
            url,
            path: item.fullPath
          };
        })
      );

      setTextures(texturesData);
    } catch (error) {
      console.error('Error fetching textures:', error);
      notifyError('Error loading textures. Please try again.');
    }
  };

  const handleTextureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      notifyError('File size should not exceed 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      notifyError('Please upload an image file');
      return;
    }

    const textureName = window.prompt('Enter a name for this texture:');
    if (!textureName) return;

    setUploadingTexture(true);
    try {
      const textureRef = ref(storage, `textureImages/${textureName}.${file.name.split('.').pop()}`);
      await uploadBytes(textureRef, file);
      const url = await getDownloadURL(textureRef);

      setTextures(prev => [...prev, {
        name: textureName,
        url,
        path: textureRef.fullPath
      }]);

      notifySuccess('Texture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading texture:', error);
      notifyError('Error uploading texture. Please try again.');
    } finally {
      setUploadingTexture(false);
    }
  };

  const handleDeleteTexture = async (texture) => {
    if (!window.confirm(`Are you sure you want to delete ${texture.name}?`)) return;

    try {
      const textureRef = ref(storage, texture.path);
      await deleteObject(textureRef);

      setTextures(prev => prev.filter(tex => tex.path !== texture.path));
      notifySuccess('Texture deleted successfully!');
    } catch (error) {
      console.error('Error deleting texture:', error);
      notifyError('Error deleting texture. Please try again.');
    }
  };

  return (
    <div className="bg-[#FAFAFA] backdrop-blur-lg border border-gray-700 rounded-lg overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-700 bg-[#37474F]">
        <h3 className="text-xl font-semibold text-white">Texture Upload</h3>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-[#37474F] border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-6 h-6 text-gray-300" />
              <span className="text-sm text-gray-300">
                {uploadingTexture ? 'Uploading...' : 'Click to upload texture image'}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleTextureUpload}
              disabled={uploadingTexture}
            />
          </label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {textures.map((texture) => (
            <div key={texture.path} className="relative group">
              <img
                src={texture.url}
                alt={texture.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center">
                <p className="text-white text-center font-medium mb-2">{texture.name}</p>
                <button
                  onClick={() => handleDeleteTexture(texture)}
                  className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TextureUpload;