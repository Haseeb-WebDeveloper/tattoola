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

// Simple UUID generator for React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
    console.log("🚀 AuthService.signUp: Starting signup process", { 
      email: credentials.email, 
      username: credentials.username, 
      role: credentials.role 
    });
    
    try {
      // Create Supabase auth user only, tagging metadata for onboarding flow (TL/AR)
      console.log("📧 AuthService.signUp: Calling supabase.auth.signUp");
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

      console.log("📧 AuthService.signUp: Supabase response", { 
        hasData: !!data, 
        hasError: !!error, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        errorMessage: error?.message 
      });

      if (error) {
        console.error("❌ AuthService.signUp: Supabase error", error);
        throw new Error(error.message);
      }

      if (!data.user) {
        console.error("❌ AuthService.signUp: No user returned from Supabase");
        throw new Error('User creation failed');
      }

      console.log("✅ AuthService.signUp: User created successfully", { 
        userId: data.user.id, 
        email: data.user.email,
        needsVerification: !data.session 
      });
    
      // Build a minimal user object for the UI; full DB profile will be created after setup
      console.log("👤 AuthService.signUp: Building minimal user object");
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

      console.log("✅ AuthService.signUp: Signup completed successfully", { 
        userId: minimalUser.id,
        needsVerification: !data.session 
      });

      return {
        user: minimalUser,
        needsVerification: !data.session,
      };
    } catch (error) {
      console.error("❌ AuthService.signUp: Signup failed", error);
      throw error;
    }
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

    console.log("saving artist profile with this data:", data)

    const userId = session.session.user.id;

    console.log("user id:", userId)

    // Ensure a users row exists for this auth user
    const { data: existingUser, error: existUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    console.log("existing user:", existingUser)

    if (existUserError) {
      throw new Error(existUserError.message);
    }

    let baseUserRow: any = existingUser;
    if (!baseUserRow) {
      const email = session.session.user.email || '';
      const username = session.session.user.user_metadata?.username || email.split('@')[0] || 'user';
      const now = new Date().toISOString();

      const { data: insertedUser, error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          username,
          firstName: data.step1.firstName,
          lastName: data.step1.lastName,
          avatar: data.step2.avatar,
          bio: data.step5.bio,
          isActive: true,
          isVerified: !!session.session.user.email_confirmed_at,
          isPublic: false,
          role: UserRole.ARTIST,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (insertUserError) {
        throw new Error(insertUserError.message);
      }

      baseUserRow = insertedUser;
    }

    console.log("base user row:", baseUserRow)
    console.log("Updating user profile with this data:", data)

    // Update user profile
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        firstName: data.step1.firstName,
        lastName: data.step1.lastName,
        avatar: data.step2.avatar,
        bio: data.step5.bio,
        instagram: data.step5.instagram,
        tiktok: data.step5.tiktok,
        province: data.step4.province,
        municipality: data.step4.municipality,
        phone: data.step4.phone,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    console.log("updated user:", updatedUser)

    // Create artist profile
    const adminOrUserClient = supabase;
    const now2 = new Date().toISOString();
    const { data: artistProfile, error: artistError } = await adminOrUserClient
      .from('artist_profiles')
      .insert({
        id: generateUUID(), // Generate UUID for the artist profile
        userId: userId,
        workArrangement: data.step3.workArrangement,
        businessName: data.step4.businessName,
        province: data.step4.province,
        municipality: data.step4.municipality,
        studioAddress: data.step4.studioAddress,
        website: data.step4.website,
        phone: data.step4.phone,
        certificateUrl: data.step4.certificateUrl,
        instagram: data.step5.instagram,
        minimumPrice: data.step9.minimumPrice,
        hourlyRate: data.step9.hourlyRate,
        isStudioOwner: data.step3.workArrangement === 'STUDIO_OWNER',
        portfolioComplete: false, // Will be set to true after portfolio projects are added
        createdAt: now2,
        updatedAt: now2,
      })
      .select()
      .single();

    if (artistError) {
      throw new Error(artistError.message);
    }

    console.log("artist profile creatd")
    console.log("creating favourite style")

    // Validate mainStyleId exists before using it
    let validMainStyleId = null;
    console.log('Validating mainStyleId:', data.step6.mainStyleId);
    if (data.step6.mainStyleId) {
      const { data: mainStyle, error: mainStyleError } = await supabase
        .from('tattoo_styles')
        .select('id')
        .eq('id', data.step6.mainStyleId)
        .single();

      console.log('Main style validation result:', { mainStyle, mainStyleError });
      if (mainStyleError || !mainStyle) {
        console.warn('Main style ID not found, skipping mainStyleId:', data.step6.mainStyleId);
      } else {
        validMainStyleId = data.step6.mainStyleId;
        console.log('Valid mainStyleId found:', validMainStyleId);
      }
    }

    // Update artist profile with valid mainStyleId
    if (validMainStyleId) {
      await supabase
        .from('artist_profiles')
        .update({ mainStyleId: validMainStyleId })
        .eq('id', artistProfile.id);
    }

    // Add favorite styles - validate against existing tattoo_styles and avoid duplicates
    console.log('Processing favorite styles:', data.step6.favoriteStyles);
    if (data.step6.favoriteStyles.length > 0) {
      const uniqueRequestedStyleIds = Array.from(new Set(data.step6.favoriteStyles.filter(Boolean)));
      console.log('Unique requested style IDs:', uniqueRequestedStyleIds);

      const { data: validStyles, error: validStylesError } = await supabase
        .from('tattoo_styles')
        .select('id')
        .in('id', uniqueRequestedStyleIds);

      console.log('Valid styles query result:', { validStyles, validStylesError });
      if (validStylesError) {
        throw new Error(validStylesError.message);
      }

      const validStyleIds = (validStyles || []).map(s => s.id);
      console.log('Valid style IDs to insert:', validStyleIds);

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

    console.log("adding services")


    // Add services - let Supabase generate UUIDs
    if (data.step7.servicesOffered && data.step7.servicesOffered.length > 0) {
      const servicesData = data.step7.servicesOffered.map((serviceId) => ({
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

    console.log("adding services")


    // Add body parts - let Supabase generate UUIDs
    if (data.step8.bodyParts && data.step8.bodyParts.length > 0) {
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

    console.log("adding body parts")

    // Add portfolio projects from step12
    console.log("step12 projects:", data.step12?.projects);
    
    const projects = data.step12?.projects || [];
    
    console.log("filtered projects:", projects);

    if (projects.length > 0) {
      let projectOrder = 1;
      for (const project of projects) {
          console.log("Processing project:", { title: project.title, description: project.description });
          
          // Skip if no title and no description
          if (!project.title && !project.description) {
            console.log("Skipping project - no title or description");
            continue;
          }

          // Use title if available, otherwise use description or a default
          const projectTitle = project.title || project.description || `Portfolio Project ${projectOrder}`;
          console.log("Using project title:", projectTitle);

          const { data: portfolioProject, error: projectError } = await adminOrUserClient
            .from('portfolio_projects')
            .insert({
              id: generateUUID(), // Generate UUID for the portfolio project
              artistId: artistProfile.id,
              title: projectTitle,
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

          console.log("Portfolio project created successfully:", portfolioProject.id);

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

      // Mark portfolio as complete if we have projects
      if (projectOrder > 1) {
        await adminOrUserClient
          .from('artist_profiles')
          .update({ portfolioComplete: true })
          .eq('id', artistProfile.id);
      }
    }

    console.log("portfolio projects added")

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
    console.log("🔐 AuthService.verifyEmail: Starting email verification", { 
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 10) + '...'
    });
    
    try {
      // For email verification, we need to use the token directly
      // The token from Supabase email contains all necessary information
      console.log("🔐 AuthService.verifyEmail: Calling supabase.auth.verifyOtp");
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      console.log("🔐 AuthService.verifyEmail: Supabase verifyOtp response", { 
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (error) {
        console.error("❌ AuthService.verifyEmail: Verification failed", error);
        throw new Error(error.message);
      }

      console.log("✅ AuthService.verifyEmail: Email verified successfully");

      // Update user verification status
      console.log("👤 AuthService.verifyEmail: Getting current session");
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.user) {
        console.log("👤 AuthService.verifyEmail: Updating user verification status", { 
          userId: session.session.user.id 
        });
        await supabase
          .from('users')
          .update({ isVerified: true })
          .eq('id', session.session.user.id);
        console.log("✅ AuthService.verifyEmail: User verification status updated");
      } else {
        console.warn("⚠️ AuthService.verifyEmail: No session found after verification");
      }
    } catch (error) {
      console.error("❌ AuthService.verifyEmail: Email verification failed", error);
      throw error;
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