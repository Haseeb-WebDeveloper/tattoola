export type HelpTab = "artisiti" | "utenti";

export type HelpCategoryType = "USER" | "ARTIST";

export type HelpCategory = {
  id: string;
  type: HelpCategoryType;
  title: string;
  loginRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type HelpArticle = {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  publication: boolean;
  type: HelpCategoryType;
  createdAt: string;
  updatedAt: string;
};

