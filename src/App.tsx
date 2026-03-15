const getProductDetails = async (barcode: string) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    const data = await response.json();

    if (data.status === 1) {
      const product = data.product;

      console.log("Product:", product.product_name);
      console.log("Ingredients:", product.ingredients_text);

      setProductName(product.product_name || "Unknown Product");
      setIngredients(product.ingredients_text || "No ingredient data");
    } else {
      alert("Product not found");
    }
  } catch (error) {
    console.error(error);
  }
};
