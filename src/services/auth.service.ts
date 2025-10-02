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
import { supabase } from '../utils/supabase';

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

    // Construct a minimal user object based on auth user for pre-setup flow
    const authUser = data.user as any;
    const isVerified = !!authUser.email_confirmed_at;
    const role = (authUser.user_metadata?.displayName === 'AR') ? UserRole.ARTIST : UserRole.TATTOO_LOVER;
    const minimalUser: User = {
      id: authUser.id,
      email: authUser.email,
      username: authUser.user_metadata?.username || '',
      firstName: undefined,
      lastName: undefined,
      avatar: undefined,
      bio: undefined,
      phone: undefined,
      country: undefined,
      province: undefined,
      municipality: undefined,
      instagram: undefined,
      tiktok: undefined,
      isActive: true,
      isVerified,
      isPublic: role === UserRole.TATTOO_LOVER,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      artistProfile: undefined,
      adminProfile: undefined,
    };

    return {
      user: minimalUser,
      session: {
        user: minimalUser,
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
    // Create Supabase auth user only, tagging metadata for onboarding flow (TL/AR)
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          displayName: credentials.role === UserRole.ARTIST ? 'AR' : 'TL',
          username: credentials.username,
        },
        emailRedirectTo: 'tattoola://', // Use app scheme for deep linking
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('User creation failed');
    }
    
    // Build a minimal user object for the UI; full DB profile will be created after setup
    const minimalUser: User = {
      id: data.user.id,
      email: credentials.email,
      username: credentials.username,
      firstName: undefined,
      lastName: undefined,
      avatar: undefined,
      bio: undefined,
      phone: undefined,
      country: undefined,
      province: undefined,
      municipality: undefined,
      instagram: undefined,
      tiktok: undefined,
      isActive: true,
      isVerified: false,
      isPublic: credentials.role === UserRole.TATTOO_LOVER,
      role: credentials.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: undefined,
      artistProfile: undefined,
      adminProfile: undefined,
    };

    return {
      user: minimalUser,
      needsVerification: !data.session,
    };
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If there's no active session, that's actually fine for sign out
        if (error.message.includes('Auth session missing')) {
          console.log('No active session to sign out from');
          return;
        }
        throw new Error(error.message);
      }
    } catch (error: any) {
      // If there's no active session, that's actually fine for sign out
      if (error.message && error.message.includes('Auth session missing')) {
        console.log('No active session to sign out from');
        return;
      }
      throw error;
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

    // Ensure a row exists in users; insert if missing, otherwise update
    const { data: existingUser, error: existError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existError) {
      throw new Error(existError.message);
    }

    let updatedUser: any = null;
    if (!existingUser) {
      // Insert new user row
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: session.session.user.email!,
          username: session.session.user.user_metadata?.username || session.session.user.email!.split('@')[0],
          firstName: data.step1.firstName,
          lastName: data.step1.lastName,
          phone: data.step1.phone,
          province: data.step2.province,
          municipality: data.step2.municipality,
          avatar: data.step3.avatar,
          instagram: data.step4.instagram,
          tiktok: data.step4.tiktok,
          isPublic: data.step6.isPublic,
          isActive: true,
          isVerified: true,
          role: UserRole.TATTOO_LOVER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }
      updatedUser = inserted;
    } else {
      // Update existing user row
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          firstName: data.step1.firstName,
          lastName: data.step1.lastName,
          phone: data.step1.phone,
          province: data.step2.province,
          municipality: data.step2.municipality,
          avatar: data.step3.avatar,
          instagram: data.step4.instagram,
          tiktok: data.step4.tiktok,
          isPublic: data.step6.isPublic,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }
      updatedUser = updated;
    }

    // Add favorite styles - validate against existing tattoo_styles and avoid duplicates
    if (data.step5.favoriteStyles.length > 0) {
      const uniqueRequestedStyleIds = Array.from(new Set(data.step5.favoriteStyles.filter(Boolean)));

      // Validate that requested style IDs exist to satisfy FK constraint
      const { data: validStyles, error: validStylesError } = await supabase
        .from('tattoo_styles')
        .select('id')
        .in('id', uniqueRequestedStyleIds);

      if (validStylesError) {
        throw new Error(validStylesError.message);
      }

      const validStyleIds = (validStyles || []).map(s => s.id);

      if (validStyleIds.length > 0) {
        // Optional: clear existing to avoid unique violations on re-run
        await supabase
          .from('user_favorite_styles')
          .delete()
          .eq('userId', userId);

        const favoriteStylesData = validStyleIds.map((styleId, index) => ({
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
        firstName: data.step1.firstName,
        lastName: data.step1.lastName,
        avatar: data.step2.avatar,
        bio: data.step5.bio,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    // Create artist profile
    const adminOrUserClient = supabase;
    const now2 = new Date().toISOString();
    const { data: artistProfile, error: artistError } = await adminOrUserClient
      .from('artist_profiles')
      .insert({
        userId: userId,
        workArrangement: data.step3.workArrangement,
        businessName: data.step4.businessName,
        province: data.step4.province,
        municipality: data.step4.municipality,
        studioAddress: data.step4.studioAddress,
        website: data.step4.website,
        phone: data.step4.phone,
        certificateUrl: data.step4.certificateUrl,
        mainStyleId: data.step6.mainStyleId,
        minimumPrice: data.step9.minimumPrice,
        hourlyRate: data.step9.hourlyRate,
        isStudioOwner: data.step3.workArrangement === 'STUDIO_OWNER',
        createdAt: now2,
        updatedAt: now2,
      })
      .select()
      .single();

    if (artistError) {
      throw new Error(artistError.message);
    }

    // Add favorite styles - validate against existing tattoo_styles and avoid duplicates
    if (data.step6.favoriteStyles.length > 0) {
      const uniqueRequestedStyleIds = Array.from(new Set(data.step6.favoriteStyles.filter(Boolean)));

      const { data: validStyles, error: validStylesError } = await supabase
        .from('tattoo_styles')
        .select('id')
        .in('id', uniqueRequestedStyleIds);

      if (validStylesError) {
        throw new Error(validStylesError.message);
      }

      const validStyleIds = (validStyles || []).map(s => s.id);

      if (validStyleIds.length > 0) {
        // Optional: clear existing to avoid unique violations on re-run
        await supabase
          .from('artist_favorite_styles')
          .delete()
          .eq('artistId', artistProfile.id);

        const favoriteStylesData = validStyleIds.map((styleId, index) => ({
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
    }

    // Add services - let Supabase generate UUIDs
    if (data.step7.services.length > 0) {
      const servicesData = data.step7.services.map((serviceId) => ({
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

    // Add body parts - let Supabase generate UUIDs
    if (data.step8.bodyParts.length > 0) {
      const bodyPartsData = data.step8.bodyParts.map((bodyPartId) => ({
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
    const projects = [
      data.step10?.projects,
      (data as any).step11?.projects,
      (data as any).step12?.projects,
    ].filter((project: any) => project && project.length > 0);

    if (projects.length > 0) {
      let projectOrder = 1;
      for (let stepIndex = 0; stepIndex < projects.length; stepIndex++) {
        const stepProjects = projects[stepIndex];
        if (!stepProjects || stepProjects.length === 0) continue;

        for (const project of stepProjects) {
          if (!project.title) continue;

          const { data: portfolioProject, error: projectError } = await adminOrUserClient
            .from('portfolio_projects')
            .insert({
              artistId: artistProfile.id,
              title: project.title,
              description: project.description,
              order: projectOrder,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .select()
            .single();

          if (projectError) {
            throw new Error(projectError.message);
          }

          // Add project media - let Supabase generate UUIDs
          const allMedia = [
            ...(project.photos || []).map((url: string) => ({ url, type: 'IMAGE' })),
            ...(project.videos || []).map((url: string) => ({ url, type: 'VIDEO' }))
          ];

          if (allMedia.length > 0) {
            const mediaData = allMedia.map((media, mediaIndex) => ({
              projectId: portfolioProject.id,
              mediaType: media.type,
              mediaUrl: media.url,
              order: mediaIndex + 1,
            }));

            const { error: mediaError } = await adminOrUserClient
              .from('portfolio_project_media')
              .insert(mediaData);

            if (mediaError) {
              throw new Error(mediaError.message);
            }
          }

          // Add project styles - let Supabase generate UUIDs
          if (project.associatedStyles && project.associatedStyles.length > 0) {
            const projectStylesData = project.associatedStyles.map((styleId: string) => ({
              projectId: portfolioProject.id,
              styleId: styleId,
            }));

            const { error: projectStylesError } = await adminOrUserClient
              .from('portfolio_project_styles')
              .insert(projectStylesData);

            if (projectStylesError) {
              throw new Error(projectStylesError.message);
            }
          }

          projectOrder++;
        }
      }

      // Mark portfolio as complete if we have projects
      if (projectOrder > 1) {
        await adminOrUserClient
          .from('artist_profiles')
          .update({ portfolioComplete: true })
          .eq('id', artistProfile.id);
      }
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
      email: '',
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