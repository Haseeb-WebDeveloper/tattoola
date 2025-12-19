// 1st step: Size
export const sizeOptions = [
  { key: "credit_card", label: "Le dimensioni di una carta di credito  💳" },
  { key: "palm", label: "Le dimensioni di un palmo di mano ✊" },
  { key: "hand", label: "Le dimensioni di una mano 🖐️" },
  { key: "half_sleeve", label: "“Mezza manica” 💪" },
] as const;

// 2nd step: References
export const referancesQuestion =
  "Puoi caricare alcuni esempi di tatuaggi che assomigliano al risultato che vorresti ottenere?";

// 3rd step: Color
export const colorOptions = [
  { key: "black_white", label: "In bianco e nero ◾◽" },
  { key: "color", label: "A colori 🎨" },
] as const;

// 4th step: Description
export const descriptionQuestion =
  "Descrivi brevemente il tatuaggio che hai in mente";

// 5th step: Age
export const ageOptions = [
  { key: true, label: "Ho più di 18 anni" },
  { key: false, label: "Ho meno di 18 anni" },
] as const;

// Constants
export const MAX_IMAGES_PER_REFERENCE_FOR_PRIVATE_REQUEST = 2;
