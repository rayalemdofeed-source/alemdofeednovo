export const WHATSAPP_NUMBER = "5581981135696";
export const WHATSAPP_DISPLAY = "(81) 98113-5696";
export const EMAIL = "ray.alemdofeed@gmail.com";
export const INSTAGRAM_HANDLE = "@ray.alemdofeed";
export const INSTAGRAM_URL = "https://instagram.com/ray.alemdofeed";
export const LOCATION = "Recife, Pernambuco";

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
