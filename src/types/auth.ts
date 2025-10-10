export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  country?: string;
  province?: string;
  municipality?: string;
  instagram?: string;
  tiktok?: string;
  isActive: boolean;
  isVerified: boolean;
  isPublic: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  artistProfile?: ArtistProfile;
  adminProfile?: AdminProfile;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  certificateUrl?: string;
  portfolioComplete: boolean;
  yearsExperience?: number;
  specialties: string[];
  businessName?: string;
  studioAddress?: string;
  province?: string;
  municipality?: string;
  location?: string;
  city?: string;
  country?: string;
  instagram?: string;
  website?: string;
  phone?: string;
  workArrangement?: WorkArrangement;
  isStudioOwner: boolean;
  minimumPrice?: number;
  hourlyRate?: number;
  coverPhoto?: string;
  coverVideo?: string;
  mainStyleId?: string;
  bannerMedia?: ArtistBannerMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface ArtistBannerMedia {
  id: string;
  artistId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  order: number;
  createdAt: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  level: AdminLevel;
  createdAt: string;
  updatedAt: string;
}

export interface TattooStyle {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Province {
  id: string;
  name: string;
  code?: string;
  country: string;
  municipalities: Municipality[];
}

export interface Municipality {
  id: string;
  name: string;
  provinceId: string;
  postalCode?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  styleId?: string;
}

export interface BodyPart {
  id: string;
  name: string;
  description?: string;
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  ARTIST = 'ARTIST',
  TATTOO_LOVER = 'TATTOO_LOVER',
}

export enum AdminLevel {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum WorkArrangement {
  STUDIO_OWNER = 'STUDIO_OWNER',
  STUDIO_EMPLOYEE = 'STUDIO_EMPLOYEE',
  FREELANCE = 'FREELANCE',
}

// Auth-specific types
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

// Multi-step registration types
// User registration types (TL - Tattoola Lover)
export interface UserRegistrationStep1 {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UserRegistrationStep2 {
  province: string;
  municipality: string;
}

export interface UserRegistrationStep3 {
  avatar?: string;
}

export interface UserRegistrationStep4 {
  instagram?: string;
  tiktok?: string;
}

export interface UserRegistrationStep5 {
  favoriteStyles: string[]; // max 4 for regular users
}

export interface UserRegistrationStep6 {
  isPublic: boolean;
}

// Artist registration (V2) steps aligned with screens step-3 .. step-13

// step-3: name + avatar
export interface ArtistRegistrationStep3 {
  firstName: string;
  lastName: string;
  avatar?: string;
}

// step-4: work arrangement (FREELANCE | STUDIO_EMPLOYEE | STUDIO_OWNER)
export interface ArtistRegistrationStep4 {
  workArrangement: WorkArrangement;
}

// step-5: studio details
export interface ArtistRegistrationStep5 {
  studioName: string;
  province: string;
  municipality: string;
  studioAddress: string;
  website?: string;
  phone: string;
}

// step-6: certifications upload
export interface ArtistRegistrationStep6 {
  certificateUrl?: string;
}

// step-7: bio + socials
export interface ArtistRegistrationStep7 {
  bio?: string;
  instagram?: string;
  tiktok?: string;
}

// step-8: favorite styles
export interface ArtistRegistrationStep8 {
  favoriteStyles: string[];
  mainStyleId?: string;
}

// step-9: services offered
export interface ArtistRegistrationStep9 {
  servicesOffered: string[];
}

// step-10: body parts
export interface ArtistRegistrationStep10 {
  bodyParts: string[];
}

// step-11: pricing
export interface ArtistRegistrationStep11 {
  minimumPrice?: number;
  hourlyRate?: number;
}

// step-12: portfolio projects (inputs)
export interface ArtistRegistrationStep12 {
  projects: PortfolioProject[];
}

// step-13: subscription selection
export interface ArtistRegistrationStep13 {
  selectedPlanId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

export interface PortfolioProject {
  id?: string;
  title?: string;
  description?: string;
  photos: string[]; // photo URLs
  videos: string[]; // video URLs
  associatedStyles: string[]; // style IDs
  order: number;
}

export interface PortfolioMedia {
  id?: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  order: number;
}

export interface Post {
  id: string;
  authorId: string;
  caption?: string;
  thumbnailUrl?: string;
  styleId?: string;
  projectId?: string;
  isActive: boolean;
  likesCount: number;
  commentsCount: number;
  showInFeed: boolean;
  createdAt: string;
  updatedAt: string;
  media?: PostMedia[];
}

export interface PostMedia {
  id: string;
  postId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  order: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPrivate: boolean;
  isPortfolioCollection: boolean;
  createdAt: string;
  updatedAt: string;
}


// Complete registration data
export interface CompleteUserRegistration {
  step1: UserRegistrationStep1;
  step2: UserRegistrationStep2;
  step3: UserRegistrationStep3;
  step4: UserRegistrationStep4;
  step5: UserRegistrationStep5;
  step6: UserRegistrationStep6;
}

export interface CompleteArtistRegistration {
  step3: ArtistRegistrationStep3;
  step4: ArtistRegistrationStep4;
  step5: ArtistRegistrationStep5;
  step6: ArtistRegistrationStep6;
  step7: ArtistRegistrationStep7;
  step8: ArtistRegistrationStep8;
  step9: ArtistRegistrationStep9;
  step10: ArtistRegistrationStep10;
  step11: ArtistRegistrationStep11;
  step12: ArtistRegistrationStep12;
  step13: ArtistRegistrationStep13;
}

// Auth error types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
  
  // Auth methods
  signIn: (credentials: LoginCredentials) => Promise<{ user: User; session: AuthSession }>;
  signUp: (credentials: RegisterCredentials) => Promise<{ user: User; needsVerification: boolean }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  
  // Registration methods
  completeUserRegistration: (data: CompleteUserRegistration) => Promise<User>;
  completeArtistRegistration: (data: CompleteArtistRegistration) => Promise<User>;
  
  // Profile methods
  updateProfile: (updates: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  
  // Verification methods
  resendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

// Form validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormErrors {
  [key: string]: string;
}

// API response types
export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Store-specific types
export interface RegistrationStepState<T> {
  data: Partial<T>;
  errors: FormErrors;
  isComplete: boolean;
  isDirty: boolean;
}

export interface RegistrationFlowState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  isSubmitting: boolean;
  canGoNext: boolean;
  canGoBack: boolean;
}