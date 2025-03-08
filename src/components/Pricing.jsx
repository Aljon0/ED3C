import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Save, Loader2, X, Upload, Trash2 } from 'lucide-react';
import { notifyError, notifySuccess, notifyWarning } from '../general/CustomToast';

function Pricing() {
 const [prices, setPrices] = useState({
    standardGravestone: {
      "20x30": 900,
      "20x40": 1000,
      "20x50": 1200,
      "20x60": 1200,
      "30x40": 2500,
      "40x50": 3000,
      "40x60": 3500,
      '15"x24"': 3500,
      '18"x24"': 4000,
      "50x60": 4000,
      "60x60": 4000,
      "60x70": 5000,
      "80x80": 6000,
      "80x90": 7000
    },
    blackGalaxyGravestone: {
      "20x30": null,
      "20x40": 1700,
      "20x50": 2000,
      "20x60": 2500,
      "30x40": 3500,
      "40x50": 4000,
      "40x60": 4500,
      '15"x24"': 4500,
      '18"x24"': 5500,
      "50x60": 5500,
      "60x60": 6000,
      "60x70": 7000,
      "80x80": 10000,
      "80x90": 12000
    },
    gravestoneBase: {
      "30x40cm - 40x50cm": 1000,
      "50x60cm - 60x60cm": 1500
    },
    pictureFrame: {
      "4x5 inches": 2400,
      "4.5x6 inches": 2600
    },
    urns: {
      withoutBlasting: {
        "Small": 1800,
        "Big": 2800
      },
      withBlasting: {
        "Small": 3100,
        "Big": 4300
      }
    },
    tableSigns: {
      withoutBlasting: {
        "Small": null,
        "Medium": null,
        "Big": null
      },
      withBlasting: {
        "Small": 1800,
        "Medium": 2000,
        "Big": 2500
      }
    },
    tableSignImages: []
  });

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchPrices();
    fetchTableSignImages();
  }, []);

  const fetchPrices = async () => {
    try {
      const pricesSnapshot = await getDocs(collection(db, 'prices'));
      if (!pricesSnapshot.empty) {
        const priceData = pricesSnapshot.docs[0].data();
        setPrices(prevPrices => ({
          ...prevPrices,
          ...priceData
        }));
      }
      setLoading(false);
    } catch (error) {
      notifyError('Error fetching prices:', error);
      setLoading(false);
      notifyError('Error loading prices. Please try again.', 'error');
    }
  };

  const handlePriceChange = (category, subCategory, size, value) => {
    setPrices(prev => {
      const updated = { ...prev };
      if (subCategory) {
        if (!updated[category]) updated[category] = {};
        if (!updated[category][subCategory]) updated[category][subCategory] = {};
        updated[category][subCategory][size] = value === '' ? null : Number(value);
      } else {
        if (!updated[category]) updated[category] = {};
        updated[category][size] = value === '' ? null : Number(value);
      }
      return updated;
    });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const savePrices = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'prices', 'current'), prices);
      notifySuccess('Prices/Image updated successfully!', 'success');
    } catch (error) {
      notifyError('Error saving prices:', error);
      notifyError('Error updating prices. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchTableSignImages = async () => {
    try {
      const imagesRef = ref(storage, 'tableSignImages');
      const imagesList = await listAll(imagesRef);
      
      const imagesData = await Promise.all(
        imagesList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const name = item.name.split('.')[0]; // Remove file extension
          return {
            name,
            url,
            path: item.fullPath
          };
        })
      );

      setPrices(prev => ({
        ...prev,
        tableSignImages: imagesData
      }));
    } catch (error) {
      notifyError('Error fetching images:', error);
      notifyError('Error loading images. Please try again.', 'error');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      notifyWarning('File size should not exceed 5MB', 'error');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      notifyWarning('Please upload an image file', 'error');
      return;
    }

    const imageName = window.prompt('Enter a name for this stone type:');
    if (!imageName) return;

    setUploadingImage(true);
    try {
      const imageRef = ref(storage, `tableSignImages/${imageName}.${file.name.split('.').pop()}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);

      setPrices(prev => ({
        ...prev,
        tableSignImages: [...prev.tableSignImages, {
          name: imageName,
          url,
          path: imageRef.fullPath
        }]
      }));

      showNotification('Image uploaded successfully!', 'success');
    } catch (error) {
      notifyError('Error uploading image:', error);
      notifyError('Error uploading image. Please try again.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (image) => {
    if (!window.confirm(`Are you sure you want to delete ${image.name}?`)) return;

    try {
      const imageRef = ref(storage, image.path);
      await deleteObject(imageRef);

      setPrices(prev => ({
        ...prev,
        tableSignImages: prev.tableSignImages.filter(img => img.path !== image.path)
      }));

      notifySuccess('Image deleted successfully!', 'success');
    } catch (error) {
      notifyError('Error deleting image:', error);
      notifyError('Error deleting image. Please try again.', 'error');
    }
  };

  const renderTableSignImagesSection = () => (
    <div className="bg-[#FAFAFA] backdrop-blur-lg border border-gray-700 rounded-lg overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-700 bg-[#37474F]">
        <h3 className="text-xl font-semibold text-white">Table Sign Stone Types</h3>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-[#37474F] border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-6 h-6 text-gray-300" />
              <span className="text-sm text-gray-300">
                {uploadingImage ? 'Uploading...' : 'Click to upload stone image'}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {prices.tableSignImages.map((image) => (
            <div key={image.path} className="relative group">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center">
                <p className="text-white text-center font-medium mb-2">{image.name}</p>
                <button
                  onClick={() => handleDeleteImage(image)}
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

  const PriceInput = ({ value, onChange, size }) => (
    <div className="flex items-center space-x-4 bg-[#37474F] p-4 rounded-lg">
      <label className="text-sm font-medium text-gray-200 w-32 flex-shrink-0">
        {size}:
      </label>
      <input
        type="text"
        value={value === null ? '' : value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter price"
      />
    </div>
  );

  const renderPriceSection = (title, category, priceData, subCategory = null) => {
    if (!priceData) return null;

    return (
      <div className="bg-[#FAFAFA] backdrop-blur-lg border border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-[#37474F]">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(priceData).map(([size, price]) => (
              <PriceInput
                key={size}
                size={size}
                value={price}
                onChange={(value) => handlePriceChange(category, subCategory, size, value)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderNestedPriceSection = (title, category, data) => {
    if (!data) return null;

    return (
      <div className="bg-[#FAFAFA] backdrop-blur-lg border border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-[#37474F]">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="p-6 space-y-8">
          {Object.entries(data).map(([subCategory, prices]) => (
            <div key={subCategory}>
              <h4 className="text-lg font-medium text-[#37474F] mb-4 pl-2 border-l-4 border-blue-500">
                {subCategory}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(prices).map(([size, price]) => (
                  <PriceInput
                    key={size}
                    size={size}
                    value={price}
                    onChange={(value) => handlePriceChange(category, subCategory, size, value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="p-8 mt-16 min-h-screen bg-[#D3D3D3] rounded">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#37474F]">Price Management</h2>
          <button
            onClick={savePrices}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-[#37474F] hover:bg-[#1C2126] hover:text-white text-white rounded-lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="grid gap-6">
          {renderPriceSection('Standard Gravestone Prices', 'standardGravestone', prices.standardGravestone)}
          {renderPriceSection('Black Galaxy Gravestone Prices', 'blackGalaxyGravestone', prices.blackGalaxyGravestone)}
          {renderPriceSection('Gravestone Base Prices', 'gravestoneBase', prices.gravestoneBase)}
          {renderPriceSection('Picture Frame Prices', 'pictureFrame', prices.pictureFrame)}
          {renderNestedPriceSection('Urn Prices', 'urns', prices.urns)}
          {renderNestedPriceSection('Table Sign Prices', 'tableSigns', prices.tableSigns)}
          {renderTableSignImagesSection()}
        </div>
      </div>
    </main>
  );
}

export default Pricing;