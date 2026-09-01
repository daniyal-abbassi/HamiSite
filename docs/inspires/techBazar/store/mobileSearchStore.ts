import {create} from 'zustand';


interface ProductQuickViewState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useMobileSearchModal = create<ProductQuickViewState>((set) => ({
  isOpen: false,
  product: null,
  openModal: () => {
    set({ isOpen: true});
  },
  closeModal: () => set({ isOpen: false }),
}));