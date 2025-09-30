import type {
  AuthSession,
  CompleteArtistRegistration,
  CompleteUserRegistration,
  ForgotPasswordData,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordData,
  User,
} from '../types/auth';
import { UserRole } from '../types/auth';
import { supabase, supabaseAdmin } from '../utils/supabase';

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(credentials: LoginCredentials): Promise<{ user: User; session: AuthSession }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Authentication failed');
    }

    // Get user profile
    const userProfile = await this.getUserProfile(data.user.id);

    return {
      user: userProfile,
      session: {
        user: userProfile,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at || 0,
      },
    };
  }

  /**
   * Sign up with email and password
   */
  static async signUp(credentials: RegisterCredentials): Promise<{ user: User; needsVerification: boolean }> {
    // First, create the auth user
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('User creation failed');
    }

    // Create user profile (use admin client if available to bypass RLS during testing)
    const client = supabaseAdmin ?? supabase;
    const now = new Date().toISOString();
    const { data: userProfile, error: profileError } = await client
      .from('users')
      .insert({
        id: data.user.id,
        email: credentials.email,
        username: credentials.username,
        role: credentials.role,
        isVerified: false,
        isActive: true,
        isPublic: credentials.role === UserRole.TATTOO_LOVER, // Default to public for regular users
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (profileError) {
      // Log the error for debugging
      console.error('Profile creation failed:', profileError);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    return {
      user: this.transformDatabaseUser(userProfile),
      needsVerification: !data.session, // If no session, email verification is required
    };
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Send forgot password email
   */
  static async forgotPassword(data: ForgotPasswordData): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: 'tattoola://reset-password',
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(data: ResetPasswordData): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Complete user registration (multi-step)
   */
  static async completeUserRegistration(data: CompleteUserRegistration): Promise<User> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('No authenticated user found');
    }

    const userId = session.session.user.id;

    // Update user profile with all collected data
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        firstName: data.step2.firstName,
        lastName: data.step2.lastName,
        phone: data.step2.phone,
        province: data.step3.province,
        municipality: data.step3.municipality,
        avatar: data.step4.avatar,
        instagram: data.step5.instagram,
        tiktok: data.step5.tiktok,
        isPublic: data.step7.isPublic,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Add favorite styles
    if (data.step6.favoriteStyles.length > 0) {
      const favoriteStylesData = data.step6.favoriteStyles.map((styleId, index) => ({
        userId: userId,
        styleId: styleId,
        order: index,
      }));

      const { error: stylesError } = await supabase
        .from('user_favorite_styles')
        .insert(favoriteStylesData);

      if (stylesError) {
        throw new Error(stylesError.message);
      }
    }

    return this.transformDatabaseUser(updatedUser);
  }

  /**
   * Complete artist registration (multi-step)
   */
  static async completeArtistRegistration(data: CompleteArtistRegistration): Promise<User> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('No authenticated user found');
    }

    const userId = session.session.user.id;

    // Update user profile
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        firstName: data.step2.firstName,
        lastName: data.step2.lastName,
        avatar: data.step3.avatar,
        bio: data.step6.bio,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    // Create artist profile
    const adminOrUserClient = supabaseAdmin ?? supabase;
    const now2 = new Date().toISOString();
    const { data: artistProfile, error: artistError } = await adminOrUserClient
      .from('artist_profiles')
      .insert({
        userId: userId,
        workArrangement: data.step4.workArrangement,
        businessName: data.step5.businessName,
        province: data.step5.province,
        municipality: data.step5.municipality,
        studioAddress: data.step5.studioAddress,
        website: data.step5.website,
        phone: data.step5.phone,
        certificateUrl: data.step5.certificateUrl,
        mainStyleId: data.step8.mainStyleId,
        minimumPrice: data.step11.minimumPrice,
        hourlyRate: data.step11.hourlyRate,
        isStudioOwner: data.step4.workArrangement === 'STUDIO_OWNER',
        createdAt: now2,
        updatedAt: now2,
      })
      .select()
      .single();

    if (artistError) {
      throw new Error(artistError.message);
    }

    // Add favorite styles
    if (data.step7.favoriteStyles.length > 0) {
      const favoriteStylesData = data.step7.favoriteStyles.map((styleId, index) => ({
        artistId: artistProfile.id,
        styleId: styleId,
        order: index,
      }));

      const { error: stylesError } = await supabase
        .from('artist_favorite_styles')
        .insert(favoriteStylesData);

      if (stylesError) {
        throw new Error(stylesError.message);
      }
    }

    // Add services
    if (data.step9.services.length > 0) {
      const servicesData = data.step9.services.map((serviceId) => ({
        artistId: artistProfile.id,
        serviceId: serviceId,
      }));

      const { error: servicesError } = await supabase
        .from('artist_services')
        .insert(servicesData);

      if (servicesError) {
        throw new Error(servicesError.message);
      }
    }

    // Add body parts
    if (data.step10.bodyParts.length > 0) {
      const bodyPartsData = data.step10.bodyParts.map((bodyPartId) => ({
        artistId: artistProfile.id,
        bodyPartId: bodyPartId,
      }));

      const { error: bodyPartsError } = await supabase
        .from('artist_body_parts')
        .insert(bodyPartsData);

      if (bodyPartsError) {
        throw new Error(bodyPartsError.message);
      }
    }

    // Add portfolio projects
    if (data.step12.projects.length > 0) {
      for (const project of data.step12.projects) {
        const { data: portfolioProject, error: projectError } = await adminOrUserClient
          .from('portfolio_projects')
          .insert({
            artistId: artistProfile.id,
            title: project.title,
            description: project.description,
            order: project.order,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (projectError) {
          throw new Error(projectError.message);
        }

        // Add project media
        if (project.media.length > 0) {
          const mediaData = project.media.map((media) => ({
            projectId: portfolioProject.id,
            mediaType: media.mediaType,
            mediaUrl: media.mediaUrl,
            order: media.order,
          }));

          const { error: mediaError } = await adminOrUserClient
            .from('portfolio_project_media')
            .insert(mediaData);

          if (mediaError) {
            throw new Error(mediaError.message);
          }
        }
      }

      // Mark portfolio as complete (4 projects uploaded)
      await adminOrUserClient
        .from('artist_profiles')
        .update({ portfolioComplete: true })
        .eq('id', artistProfile.id);
    }

    return this.transformDatabaseUser(updatedUser);
  }

  /**
   * Get current user profile
   */
  static async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        artist_profiles(*),
        user_favorite_styles(
          styleId,
          order,
          tattoo_styles(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.transformDatabaseUser(data);
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.transformDatabaseUser(data);
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: '', // Will use the email from the current session
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      throw new Error(error.message);
    }

    // Update user verification status
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await supabase
        .from('users')
        .update({ isVerified: true })
        .eq('id', session.session.user.id);
    }
  }

  /**
   * Transform database user to app user type
   */
  private static transformDatabaseUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      avatar: dbUser.avatar,
      bio: dbUser.bio,
      phone: dbUser.phone,
      country: dbUser.country,
      province: dbUser.province,
      municipality: dbUser.municipality,
      instagram: dbUser.instagram,
      tiktok: dbUser.tiktok,
      isActive: dbUser.isActive,
      isVerified: dbUser.isVerified,
      isPublic: dbUser.isPublic,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      lastLoginAt: dbUser.lastLoginAt,
      artistProfile: dbUser.artist_profiles ? {
        id: dbUser.artist_profiles.id,
        userId: dbUser.artist_profiles.userId,
        certificateUrl: dbUser.artist_profiles.certificateUrl,
        portfolioComplete: dbUser.artist_profiles.portfolioComplete,
        yearsExperience: dbUser.artist_profiles.yearsExperience,
        specialties: dbUser.artist_profiles.specialties,
        businessName: dbUser.artist_profiles.businessName,
        studioAddress: dbUser.artist_profiles.studioAddress,
        province: dbUser.artist_profiles.province,
        municipality: dbUser.artist_profiles.municipality,
        location: dbUser.artist_profiles.location,
        city: dbUser.artist_profiles.city,
        country: dbUser.artist_profiles.country,
        instagram: dbUser.artist_profiles.instagram,
        website: dbUser.artist_profiles.website,
        phone: dbUser.artist_profiles.phone,
        workArrangement: dbUser.artist_profiles.workArrangement,
        isStudioOwner: dbUser.artist_profiles.isStudioOwner,
        minimumPrice: dbUser.artist_profiles.minimumPrice,
        hourlyRate: dbUser.artist_profiles.hourlyRate,
        coverPhoto: dbUser.artist_profiles.coverPhoto,
        coverVideo: dbUser.artist_profiles.coverVideo,
        mainStyleId: dbUser.artist_profiles.mainStyleId,
        createdAt: dbUser.artist_profiles.createdAt,
        updatedAt: dbUser.artist_profiles.updatedAt,
      } : undefined,
    };
  }
}
