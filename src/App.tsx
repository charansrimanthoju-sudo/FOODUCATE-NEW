import React, { useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./App.css";

const App: React.FC = () => {
  const [productName, setProductName] = useState<string>("");
  const [ingredients, setIngredients] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");

  const getProductDetails = async (barcodeValue: string) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`
      );

      const data = await response.json();

      if (data.status === 1) {
        const product = data.product;

        setProductName(product.product_name || "Unknown Product");
        setIngredients(product.ingredients_text || "Ingredients not available");
      } else {
        setProductName("Product not found");
        setIngredients("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startScanner = () => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText: string) => {
        setBarcode(decodedText);
        getProductDetails(decodedText);
        scanner.clear();
      },
      (error: any) => {
        console.warn(error);
      }
    );
  };

  return (
    <div className="App">
      <h1>FOODUCATE</h1>
      <h2>Scan Food Barcode</h2>

      <button onClick={startScanner}>Start Scanner</button>

      <div id="reader" style={{ width: "300px", margin: "20px auto" }}></div>

      <div style={{ marginTop: "20px" }}>
        <h3>Barcode:</h3>
        <p>{barcode}</p>

        <h3>Product Name:</h3>
        <p>{productName}</p>

        <h3>Ingredients:</h3>
        <p>{ingredients}</p>
      </div>
    </div>
  );
};

export default App;
