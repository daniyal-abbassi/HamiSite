
export const formatPrice = (price: number): string => {
    // Format the price to two decimal places
    const formattedPrice = price.toFixed(2);
  
    // Add commas for thousands separator
    const parts = formattedPrice.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
    return parts.join('.');
  };