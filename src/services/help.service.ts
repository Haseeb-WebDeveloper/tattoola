import { supabase } from "@/utils/supabase";
import type {
  HelpArticle,
  HelpCategory,
  HelpCategoryType,
} from "@/types/help";

/**
 * Fetch help categories from database based on type
 * @param type - The category type (USER or ARTIST)
 * @returns Array of help categories
 */
export async function getHelpCategories(
  type: HelpCategoryType
): Promise<HelpCategory[]> {
  const { data, error } = await supabase
    .from("help_categories")
    .select("*")
    .eq("type", type)
    .order("order", { ascending: true })
    .order("createdAt", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((category) => ({
    id: category.id,
    type: category.type as HelpCategoryType,
    title: category.title,
    loginRequired: category.loginRequired,
    order: category.order,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }));
}

/**
 * Fetch help articles for a specific category
 * @param categoryId - The category ID
 * @returns Array of help articles
 */
export async function getHelpArticles(
  categoryId: string
): Promise<HelpArticle[]> {
  const { data, error } = await supabase
    .from("help_articles")
    .select("*")
    .eq("categoryId", categoryId)
    .eq("publication", true)
    .order("createdAt", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((article) => ({
    id: article.id,
    categoryId: article.categoryId,
    title: article.title,
    slug: article.slug,
    description: article.description,
    publication: article.publication,
    type: article.type as HelpCategoryType,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  }));
}

/**
 * Fetch a single help category by ID
 * @param categoryId - The category ID
 * @returns Help category or null
 */
export async function getHelpCategory(
  categoryId: string
): Promise<HelpCategory | null> {
  const { data, error } = await supabase
    .from("help_categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    type: data.type as HelpCategoryType,
    title: data.title,
    loginRequired: data.loginRequired,
    order: data.order,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Fetch a single help article by ID
 * @param articleId - The article ID
 * @returns Help article or null
 */
export async function getHelpArticle(
  articleId: string
): Promise<HelpArticle | null> {
  const { data, error } = await supabase
    .from("help_articles")
    .select("*")
    .eq("id", articleId)
    .eq("publication", true)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    categoryId: data.categoryId,
    title: data.title,
    slug: data.slug,
    description: data.description,
    publication: data.publication,
    type: data.type as HelpCategoryType,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

