
export const calculateDiscount = (price:number, discount:number) => {

    const discountedPrice = price - (price * discount) / 100;
    return discountedPrice
}