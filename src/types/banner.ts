export type BannerType = "4_IMAGES" | "1_IMAGE" | "1_VIDEO" | null;

export interface BannerMedia {
  id?: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  bannerType?: string;
  order: number;
}

