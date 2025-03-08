import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import Navigation from "../components/Navigation.jsx";
import PreviewArea from "../components/PreviewArea.jsx";
import { Upload } from "lucide-react";
import { notifySuccess, notifyError, notifyWarning } from "../general/CustomToast.js"
import { useLocation } from "react-router-dom";
import notifications from "../components/notifications.jsx";


const Create = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedCanvas, setSelectedCanvas] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [baseCost, setBaseCost] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [userData, setUserData] = useState(null);
  const [productChoice, setProductChoice] = useState("");
  const [addOns, setAddOns] = useState([]);
  const [pictureFrameSize, setPictureFrameSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [nameCount, setNameCount] = useState(0);
  const [totalAddOnsCost, setTotalAddOnsCost] = useState(0);
  const [selectedBaseSize, setSelectedBaseSize] = useState("");
  const [tableSignImages, setTableSignImages] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [sceneThumbnail, setSceneThumbnail] = useState(null);
  const rendererRef = useRef(null);
  const canvasRef = useRef(null);

  const [prices, setPrices] = useState({
    standardGravestone: {},
    blackGalaxyGravestone: {},
    gravestoneBase: {},
    pictureFrame: {},
    urns: {
      withoutBlasting: {},
      withBlasting: {},
    },
    tableSigns: {
      withoutBlasting: {},
      withBlasting: {},
    }
  });

  const [editSession, setEditSession] = useState(null);
  const location = useLocation();
  const auth = getAuth();

  const [previewState, setPreviewState] = useState({
    selectedObject: "gravestone", // Default values from PreviewArea
    selectedTexture: "marble"     // Default values from PreviewArea
  });

  // Update the useEffect to watch for PreviewArea state changes
  useEffect(() => {
    const handlePreviewStateChange = () => {
      if (window.currentSceneState) {
        setPreviewState({
          selectedObject: window.currentSceneState.selectedObject,
          selectedTexture: window.currentSceneState.selectedTexture
        });
      }
    };

    // Initial load
    handlePreviewStateChange();

    // Set up an interval to check for changes
    const interval = setInterval(handlePreviewStateChange, 1000);

    return () => clearInterval(interval);
  }, []);

  // Map PreviewArea values to order form values
  const mapObjectToItem = (selectedObject) => {
    const mapping = {
      "gravestone": "Gravestone",
      "base": "Gravestone base",
      "Urns": "Urns",
      "table-signs": "table-signs"
    };
    return mapping[selectedObject] || selectedObject;
  };

  const mapTextureToCanvas = (texture) => {
    const mapping = {
      "marble": "Marble",
      "galaxy": "Black Galaxy Granite",
      "ceramic": "Ceramic Tiles",
      "black": "Plain Black",
      "white": "Plain White",
      "ilauran": "Ilauran White",
      "biege": "biege",
      "giraffe": "giraffe"
    };
    return mapping[texture] || texture;
  };


  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const loadEditSession = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session');

      if (sessionId) {
        try {
          const sessionDoc = await getDoc(doc(db, 'editSessions', sessionId));
          if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data();
            setEditSession(sessionData);

            // Apply the scene state to your editor
            if (sessionData.sceneState) {
              // Your existing scene state application logic here
              window.currentSceneState = sessionData.sceneState;
              // Additional logic to apply textures, models, etc.
            }
          }
        } catch (error) {
          console.error('Error loading edit session:', error);
          notifyError('Error loading design. Please try again.');
        }
      }
    };

    loadEditSession();
  }, [location]);

  const getCanvasThumbnail = async () => {
    try {
      const canvas = document.querySelector('.canvas-container canvas');
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      return new Promise((resolve, reject) => {
        try {
          // Ensure we're getting a good quality image
          const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
          if (!dataUrl) {
            reject(new Error('Failed to create data URL from canvas'));
            return;
          }
          resolve(dataUrl);
        } catch (err) {
          reject(new Error(`Canvas capture failed: ${err.message}`));
        }
      });
    } catch (error) {
      console.error('Error in getCanvasThumbnail:', error);
      throw error;
    }
  };

  const handlePlaceOrderClick = async () => {
    try {
      const thumbnail = await getCanvasThumbnail();
      if (thumbnail) {
        setSceneThumbnail(thumbnail);
      } else {
        notifyWarning("Could not generate scene preview");
      }
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error handling order click:', error);
      notifyError('Failed to generate preview');
    }
  };

  useEffect(() => {
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

        setTableSignImages(imagesData);
      } catch (error) {
        console.error('Error fetching table sign images:', error);
      }
    };

    if (selectedItem === "table-signs") {
      fetchTableSignImages();
    }
  }, [selectedItem]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const pricesSnapshot = await getDoc(doc(db, 'prices', 'current'));
        if (pricesSnapshot.exists()) {
          setPrices(pricesSnapshot.data());
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    fetchPrices();
  }, []);

  // Fetch user data (unchanged)
  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();

      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDocRef = doc(db, 'Users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              setUserData({
                id: user.uid,
                firstName: data.firstName || '',
                surname: data.surname || '',
                email: data.email || '',
                contact: data.contact || '',
                address: data.address || ''
              });
            } else {
              notifyError("No user document found!");
            }
          } catch (error) {
            notifyError("Error fetching user data:", error);
          }
        }
      });
    };

    fetchUserData();
  }, []);

  const itemTypes = {
    "Gravestone": ["Black Galaxy Granite", "Ceramic Tiles", "Plain Black", "Plain White", "Ilauran White", "biege", "giraffe"],
    "Gravestone base": ["Black galaxy granite", "Ceramic Tiles"],
    "Urns": ["Marble"],
    "table-signs": ["Plain White", "Plain Black", "Black Galaxy"]
  };

  const gravestoneBaseSizes = {
    "30x40cm - 40x50cm": 1000,
    "50x60cm - 60x60cm": 1500
  };

  const pictureFrameSizes = {
    "4x5 inches": 2400,
    "4.5x6 inches": 2600
  };

  useEffect(() => {
    if (!baseCost) return;

    let addOnsCost = 0;
    let basePrice = parseInt(baseCost);

    // Calculate add-ons cost
    addOns.forEach(addon => {
      if (addon === "Picture" && pictureFrameSize) {
        addOnsCost += prices.pictureFrame[pictureFrameSize] || 0;
      } else if (addon === "Gravestone Base" && selectedBaseSize) {
        addOnsCost += prices.gravestoneBase[selectedBaseSize] || 0;
      } else if (addon === "Per Name") {
        addOnsCost += 500 * nameCount;
      }
    });

    setTotalAddOnsCost(addOnsCost);

    const totalCost = basePrice + addOnsCost;

    if (paymentType === "partial") {
      setFinalCost((totalCost / 2).toString());
    } else {
      setFinalCost(totalCost.toString());
    }
  }, [selectedSize, baseCost, paymentType, addOns, pictureFrameSize, nameCount, selectedBaseSize, prices]);

  const handleBaseSelection = (e) => {
    setSelectedBaseSize(e.target.value);
  };

  const handleNameCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setNameCount(count);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        notifyWarning("File size should not exceed 5MB");
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.preventDefault(); // Prevent event bubbling
    e.stopPropagation(); // Prevent event bubbling
    setSelectedImage(null);

    // Reset the file input if needed
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleAddOnChange = (addon) => {
    if (addon === "Gravestone Base" && !selectedSize) {
      notifyWarning("Please select a size first before adding a gravestone base.");
      return;
    }

    setAddOns(prev => {
      if (prev.includes(addon)) {
        return prev.filter(item => item !== addon);
      } else {
        return [...prev, addon];
      }
    });
  };


  const handleProductChoiceChange = (e) => {
    const choice = e.target.value;
    setProductChoice(choice);
    setSelectedSize(""); // Reset size when product choice changes
    setBaseCost("");
    setFinalCost("");
  };

  const handleItemChange = (e) => {
    const item = e.target.value;
    setSelectedItem(item);
    setSelectedCanvas("");
    setSelectedSize("");
    setBaseCost("");
    setFinalCost("");
    setPaymentType("");
    setProductChoice("");
    setAddOns([]);
    setPictureFrameSize("");
    setSelectedImage(null);
  };

  const handleSizeChange = (e) => {
    const size = e.target.value;
    setSelectedSize(size);

    let initialCost = 0;

    // Modified logic to use mapped values
    const mappedItem = mapObjectToItem(previewState.selectedObject);
    const mappedCanvas = mapTextureToCanvas(previewState.selectedTexture);

    if (mappedItem === "Gravestone") {
      if (mappedCanvas === "Black Galaxy Granite") {
        initialCost = prices.blackGalaxyGravestone?.[size] || 0;
      } else {
        initialCost = prices.standardGravestone?.[size] || 0;
      }
    } else if (mappedItem === "Gravestone base") {
      initialCost = prices.gravestoneBase?.[size] || 0;
    } else if (mappedItem === "Urns") {
      const category = productChoice === "With Blasting" ? "withBlasting" : "withoutBlasting";
      initialCost = prices.urns?.[category]?.[size] || 0;
    } else if (mappedItem === "table-signs") {
      const category = productChoice === "With Blasting" ? "withBlasting" : "withoutBlasting";
      initialCost = prices.tableSigns?.[category]?.[size] || 0;
    }

    setBaseCost(initialCost.toString());
    setFinalCost(initialCost.toString());
  };

  const getSizeOptions = () => {
    const mappedItem = mapObjectToItem(previewState.selectedObject);
    const mappedCanvas = mapTextureToCanvas(previewState.selectedTexture);

    if (mappedItem === "Gravestone") {
      if (mappedCanvas === "Black Galaxy Granite") {
        return Object.entries(prices.blackGalaxyGravestone || {})
          .filter(([_, price]) => price !== null);
      } else {
        return Object.entries(prices.standardGravestone || {})
          .filter(([_, price]) => price !== null);
      }
    } else if (mappedItem === "Gravestone base") {
      return Object.entries(prices.gravestoneBase || {})
        .filter(([_, price]) => price !== null);
    } else if (mappedItem === "Urns" && productChoice) {
      const category = productChoice === "With Blasting" ? "withBlasting" : "withoutBlasting";
      return Object.entries(prices.urns?.[category] || {})
        .filter(([_, price]) => price !== null);
    } else if (mappedItem === "table-signs" && productChoice) {
      const category = productChoice === "With Blasting" ? "withBlasting" : "withoutBlasting";
      return Object.entries(prices.tableSigns?.[category] || {})
        .filter(([_, price]) => price !== null);
    }
    return [];
  };

  const handleCancelClick = () => {
    setIsModalOpen(false);
  };

  const handleConfirmClick = async () => {
    // Get the mapped values from PreviewArea state
    const mappedItem = mapObjectToItem(previewState.selectedObject);
    const mappedCanvas = mapTextureToCanvas(previewState.selectedTexture);

    // Check if it's an item that needs product choice
    const needsProductChoice = mappedItem === "Urns" || mappedItem === "table-signs";

    // Validate required fields
    if (!mappedItem || !mappedCanvas || !selectedSize || !paymentType) {
      notifyWarning("Please fill in all required fields");
      return;
    }

    // Additional validation for items that need product choice
    if (needsProductChoice && !productChoice) {
      notifyWarning("Please select a product type");
      return;
    }

    if (!userData?.id) {
      notifyError("User ID not found. Please log in again.");
      return;
    }

    try {
      let pictureFrameImage = null;
      let sceneImageUrl = null;

      // Upload picture frame image if it exists
      if (selectedImage && addOns.includes("Picture")) {
        const imageRef = ref(storage, `pictureFrames/${userData.id}_${Date.now()}`);
        await uploadBytes(imageRef, selectedImage);
        pictureFrameImage = await getDownloadURL(imageRef);
      }

      // Upload scene thumbnail if it exists
      if (sceneThumbnail) {
        try {
          const response = await fetch(sceneThumbnail);
          const blob = await response.blob();
          const timestamp = Date.now();
          const filename = `sceneImages/${userData.id}/${timestamp}`;
          const sceneImageRef = ref(storage, filename);

          const metadata = {
            contentType: 'image/jpeg',
            customMetadata: {
              'userId': userData.id,
              'timestamp': timestamp.toString()
            }
          };

          await uploadBytes(sceneImageRef, blob, metadata);
          sceneImageUrl = await getDownloadURL(sceneImageRef);
        } catch (error) {
          console.error('Error uploading scene image:', error);
          throw new Error(`Failed to upload scene image: ${error.message}`);
        }
      }

      const orderData = {
        customerId: userData.id,
        customerName: `${userData.firstName} ${userData.surname}`,
        customerEmail: userData.email,
        customerContact: userData.contact,
        customerAddress: userData.address,
        item: mappedItem, // Use mapped item from PreviewArea
        material: mappedCanvas, // Use mapped canvas from PreviewArea
        size: selectedSize,
        design: mappedItem === "table-signs" ? selectedDesign : null,
        paymentType: paymentType === 'partial' ? '50% Down Payment' : 'Full Payment',
        amount: parseInt(finalCost),
        baseCost: parseInt(baseCost),
        totalAmount: parseInt(paymentType === 'partial' ? finalCost * 2 : finalCost),
        status: 'Pending',
        dateOrdered: new Date().toISOString(),
        expectedDate: null,
        addOns: addOns,
        pictureFrameSize: addOns.includes("Picture") ? pictureFrameSize : null,
        pictureFrameImage: pictureFrameImage,
        selectedBaseSize: addOns.includes("Gravestone Base") ? selectedBaseSize : null,
        nameCount: addOns.includes("Per Name") ? nameCount : null,
        sceneImage: sceneImageUrl,
        timestamp: Date.now(),
        userId: userData.id,
        productChoice: needsProductChoice ? productChoice : null // Add product choice if applicable
      };

      // Add the order to the database
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Create a detailed notification message for the owner
      const notificationMessage =
        `New order placed by ${userData.firstName} ${userData.surname}\n\n` +
        `Item: ${mappedItem}\n` +
        `Material: ${mappedCanvas}\n` +
        `Size: ${selectedSize}\n` +
        (needsProductChoice ? `Product Type: ${productChoice}\n` : '') +
        (mappedItem === "table-signs" ? `Design: ${selectedDesign?.name}\n` : '') +
        `Payment Type: ${paymentType === 'partial' ? '50% Down Payment' : 'Full Payment'}\n` +
        `Amount: ₱${parseInt(finalCost).toLocaleString()}\n` +
        (addOns.length > 0 ? `Add-ons: ${addOns.join(', ')}\n` : '') +
        `Contact: ${userData.contact}\n` +
        `Email: ${userData.email}`;

      // Create notification for owner using our notification system
      await notifications.createOwnerNotification(
        notificationMessage,
        orderRef.id
      );

      notifySuccess("Order placed successfully!");
      setIsModalOpen(false);

      // Reset all states
      setSelectedItem("");
      setSelectedCanvas("");
      setSelectedSize("");
      setBaseCost("");
      setPaymentType("");
      setFinalCost("");
      setSelectedDesign(null);
      setAddOns([]);
      setPictureFrameSize("");
      setSelectedImage(null);
      setNameCount(0);
      setSelectedBaseSize("");
      setSceneThumbnail(null);
      setProductChoice("");
    } catch (error) {
      console.error("Error placing order:", error);
      notifyError("Error placing order. Please try again.");
    }
  };

  const handleCanvasChange = (e) => {
    setSelectedCanvas(e.target.value);
    setSelectedSize("");
    setBaseCost("");
    setFinalCost("");
    setPaymentType("");
  };

  const handlePaymentTypeChange = (e) => {
    const type = e.target.value;
    setPaymentType(type);

    if (baseCost && type) {
      const cost = parseInt(baseCost);
      setFinalCost(type === "partial" ? (cost / 2).toString() : cost.toString());
    } else {
      setFinalCost("");
    }
  };

  const getImagePreview = () => {
    if (selectedImage) {
      return URL.createObjectURL(selectedImage);
    }
    return null;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const renderDesignSelection = () => {
    if (selectedItem !== "table-signs" || !selectedSize) return null;

    return (
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose a kind of design:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tableSignImages.map((image) => (
            <div
              key={image.path}
              className={`relative cursor-pointer group transition-all duration-200 ${selectedDesign?.path === image.path
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:opacity-80'
                }`}
              onClick={() => setSelectedDesign(image)}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className={`absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center ${selectedDesign?.path === image.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}>
                <p className="text-white text-center font-medium p-2">
                  {image.name}
                  {selectedDesign?.path === image.path && (
                    <span className="block text-sm text-blue-300">Selected</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSizeSelection = () => {
    const mappedItem = mapObjectToItem(previewState.selectedObject);
    const needsProductChoice = mappedItem === "Urns" || mappedItem === "table-signs";
    const canSelectSize = !needsProductChoice || (needsProductChoice && productChoice);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={selectedSize}
          onChange={handleSizeChange}
          disabled={!canSelectSize}
        >
          <option value="">Select a size</option>
          {getSizeOptions().map(([size, price]) => (
            <option key={size} value={size}>
              {size} {price ? `- ₱${price.toLocaleString()}` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Update the payment type selection in the modal
  const renderPaymentType = () => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Type
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
          value={paymentType}
          onChange={handlePaymentTypeChange}
          disabled={!selectedSize} // Only disable if size isn't selected
        >
          <option value="">Select payment type</option>
          <option value="full">Full Payment</option>
          <option value="partial">Partial Payment (50%)</option>
        </select>
      </div>
    );
  };

  return (
    <>
      <Navigation />
      <main className="ml-64 h-screen bg-gray-50 overflow-hidden flex flex-col">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto flex flex-col h-full">
            <div className="flex-1">
              <PreviewArea />
            </div>

            <div className="mt-6 mb-8 flex justify-center">
              <button
                className="bg-[#2F424B] hover:bg-[#445166] text-white text-xl px-8 py-4 rounded-lg transition-colors duration-200"
                onClick={handlePlaceOrderClick}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            {/* Add the close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Close modal"
            >
              <img
                src="/assets/line-md--remove.svg"
                alt="Close"
                className="w-6 h-6"
              />
            </button>

            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#2F424B]">Place Order</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Preview of Design</p>
                  {sceneThumbnail ? (
                      <div className="relative w-full">
                          <img
                              src={sceneThumbnail}
                              alt="Scene Preview"
                              className="w-full h-auto object-contain rounded-md"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl font-bold text-white/50 transform -rotate-45 select-none pointer-events-none">
                                  DOUBLE SEVEN
                              </span>
                          </div>
                      </div>
                  ) : (
                      <div className="h-24 bg-white border rounded-md flex items-center justify-center text-gray-400">
                          No preview available
                      </div>
                  )}
              </div>

              <div className="space-y-4">
                {/* Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    value={mapObjectToItem(previewState.selectedObject)}
                    readOnly
                  />
                </div>

                {/* Product Choice for Urns and Table Signs */}
                {(mapObjectToItem(previewState.selectedObject) === "Urns" ||
                  mapObjectToItem(previewState.selectedObject) === "table-signs") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Choice
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                        value={productChoice}
                        onChange={handleProductChoiceChange}
                      >
                        <option value="">Select product type</option>
                        <option value="Without Blasting">Without Blasting</option>
                        <option value="With Blasting">With Blasting</option>
                      </select>
                    </div>
                  )}

                {/* Canvas Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canvas Selection
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    value={mapTextureToCanvas(previewState.selectedTexture)}
                    readOnly
                  />
                </div>

                {/* Size Selection */}
                {renderSizeSelection()}

                {/* Payment Type */}
                {renderPaymentType()}

                <div>
                  {renderDesignSelection()}
                </div>

                {/* Add-ons Section */}
                {selectedItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add-ons
                    </label>
                    <div className="space-y-2">
                      {selectedItem === "Gravestone" && (
                        <>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="pictureFrame"
                              checked={addOns.includes("Picture")}
                              onChange={() => handleAddOnChange("Picture")}
                              className="mr-2"
                            />
                            <label htmlFor="pictureFrame">Picture</label>
                          </div>

                          {addOns.includes("Picture") && (
                            <div className="ml-6 space-y-4">
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                value={pictureFrameSize}
                                onChange={(e) => setPictureFrameSize(e.target.value)}
                              >
                                <option value="">Select frame size</option>
                                {Object.entries(pictureFrameSizes).map(([size, price]) => (
                                  <option key={size} value={size}>
                                    {size} - ₱{price.toLocaleString()}
                                  </option>
                                ))}
                              </select>

                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#2F424B] transition-colors">
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    aria-label="Upload image"
                                    disabled={!!selectedImage} // Disable input when image is selected
                                  />
                                  <div className="text-center p-4">
                                    {selectedImage ? (
                                      <div className="space-y-4">
                                        <img
                                          src={getImagePreview()}
                                          alt="Preview"
                                          className="mx-auto max-h-48 rounded-lg shadow-sm"
                                        />
                                        <p className="text-sm text-gray-600">
                                          {selectedImage.name}
                                        </p>
                                        <button
                                          onClick={handleRemoveImage}
                                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
                                          type="button"
                                        >
                                          Remove Image
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 flex-col">
                                          <label className="relative cursor-pointer rounded-md font-medium text-[#2F424B] hover:text-[#445166]">
                                            <span>Click to upload</span>
                                          </label>
                                          <p className="text-xs">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          PNG, JPG, GIF up to 5MB
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedItem === "Gravestone" && (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="gravestoneBase"
                                  checked={addOns.includes("Gravestone Base")}
                                  onChange={() => handleAddOnChange("Gravestone Base")}
                                  className="mr-2"
                                />
                                <label htmlFor="gravestoneBase">Gravestone Base</label>
                              </div>

                              {addOns.includes("Gravestone Base") && (
                                <div className="ml-6">
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                    value={selectedBaseSize}
                                    onChange={handleBaseSelection}
                                  >
                                    <option value="">Select base size</option>
                                    {Object.entries(gravestoneBaseSizes).map(([size, price]) => (
                                      <option key={size} value={size}>
                                        {size} - ₱{price.toLocaleString()}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Per Name for Gravestone */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="perName"
                              checked={addOns.includes("Per Name")}
                              onChange={() => handleAddOnChange("Per Name")}
                              className="mr-2"
                            />
                            <label htmlFor="perName">Per Name (₱500 each)</label>
                          </div>

                          {addOns.includes("Per Name") && (
                            <div className="ml-6">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={nameCount}
                                  onChange={handleNameCountChange}
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-600">
                                  names (Total: ₱{(500 * nameCount).toLocaleString()})
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {selectedItem === "Urns" && (
                        <>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="perNameUrn"
                              checked={addOns.includes("Per Name")}
                              onChange={() => handleAddOnChange("Per Name")}
                              className="mr-2"
                            />
                            <label htmlFor="perNameUrn">Per Name (₱500 each)</label>
                          </div>

                          {addOns.includes("Per Name") && (
                            <div className="ml-6">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={nameCount}
                                  onChange={handleNameCountChange}
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-600">
                                  names (Total: ₱{(500 * nameCount).toLocaleString()})
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Cost Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent bg-gray-50"
                    value={finalCost ? `₱${parseInt(finalCost).toLocaleString()}` : ''}
                    readOnly
                    placeholder="Cost will be calculated based on selection"
                  />
                  {paymentType === "partial" && finalCost && (
                    <p className="text-sm text-gray-600 mt-1">
                      Full price: ₱{(parseInt(finalCost) * 2).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Additional Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Features
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F424B] focus:border-transparent h-24 resize-none"
                    placeholder="Describe additional features of your order"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                    onClick={handleCancelClick}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#2F424B] hover:bg-[#445166] text-white rounded-md transition-colors duration-200"
                    onClick={handleConfirmClick}
                  >
                    Confirm Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Create;