
import OwnerHeader from "../components/OwnerHeader";
import OwnerSideBar from "../components/OwnerSideBar";
import PreviewArea from "../components/PreviewArea";
import React, { useState, useEffect } from 'react';
import { notifyError } from "../general/CustomToast";


function CustomizeDesign() {
    const [savedDesignState, setSavedDesignState] = useState(null);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('currentEditDesign');
      // Only parse if savedState exists
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setSavedDesignState(parsedState);
        // Clear the saved state from localStorage
        localStorage.removeItem('currentEditDesign');
      }
    } catch (error) {
      notifyError('Error loading saved design:', error);
      localStorage.removeItem('currentEditDesign'); // Clean up invalid data
    }
  }, []);

    return (
        <>
            <OwnerHeader />
            <OwnerSideBar />
            <main className="ml-64 mt-16 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12">
                            <PreviewArea initialState={savedDesignState} />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default CustomizeDesign;
