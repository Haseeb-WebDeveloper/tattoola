import { generateUUID } from "@/utils/randomUUIDValue";
import type {
  AuthSession,
  CompleteArtistRegistration,
  CompleteUserRegistration,
  ForgotPasswordData,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordData,
  User,
} from "../types/auth";
import { UserRole } from "../types/auth";
import { logger } from "../utils/logger";
import { supabase } from "../utils/supabase";
import { buildGoogleMapsUrl } from "./location.service";

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(
    credentials: LoginCredentials
  ): Promise<{ user: User; session: AuthSession }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Authentication failed");
    }

    // Guard: prevent login for deactivated users
    try {
      const authUserId = data.user.id;
      const { data: dbUser, error: dbErr } = await supabase
        .from("users")
        .select("id, isActive")
        .eq("id", authUserId)
        .maybeSingle();

      if (!dbErr && dbUser && dbUser.isActive === false) {
        // Immediately sign them out and block login
        await supabase.auth.signOut();
        throw new Error(
          "Your account has been deactivated. Please contact support."
        );
      }
    } catch (guardErr: any) {
      // Re-throw guard error messages; other errors should still block login gracefully
      if (guardErr instanceof Error) {
        throw guardErr;
      }
      throw new Error(
        "Unable to sign in at this time. Please try again later."
      );
    }

    // Construct a minimal user object based on auth user for pre-setup flow
    const authUser = data.user as any;
    const isVerified = !!authUser.email_confirmed_at;
    const role =
      authUser.user_metadata?.displayName === "AR"
        ? UserRole.ARTIST
        : UserRole.TATTOO_LOVER;
    const minimalUser: User = {
      id: authUser.id,
      email: authUser.email,
      username: authUser.user_metadata?.username || "",
      firstName: undefined,
      lastName: undefined,
      avatar: undefined,
      bio: undefined,
      phone: undefined,
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
  static async signUp(
    credentials: RegisterCredentials
  ): Promise<{ user: User; needsVerification: boolean }> {
    logger.log("AuthService.signUp: Starting signup process", {
      email: credentials.email,
      username: credentials.username,
      role: credentials.role,
    });

    try {
      // Create Supabase auth user only, tagging metadata for onboarding flow (TL/AR)
      logger.log("AuthService.signUp: Calling supabase.auth.signUp");
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            displayName: credentials.role === UserRole.ARTIST ? "AR" : "TL",
            username: credentials.username,
          },
          emailRedirectTo: "tattoola://verify", // Match expo-router route (groups don't create segments)
        },
      });

      logger.log("AuthService.signUp: Supabase response", {
        hasData: !!data,
        hasError: !!error,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        errorMessage: error?.message,
      });

      if (error) {
        logger.error("AuthService.signUp: Supabase error", error);
        throw new Error(error.message);
      }

      if (!data.user) {
        logger.error("AuthService.signUp: No user returned from Supabase");
        throw new Error("User creation failed");
      }

      logger.log("AuthService.signUp: User created successfully", {
        userId: data.user.id,
        email: data.user.email,
        needsVerification: !data.session,
      });

      // Build a minimal user object for the UI; full DB profile will be created after setup
      logger.log("AuthService.signUp: Building minimal user object");
      const minimalUser: User = {
        id: data.user.id,
        email: credentials.email,
        username: credentials.username,
        firstName: undefined,
        lastName: undefined,
        avatar: undefined,
        bio: undefined,
        phone: undefined,
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

      logger.log("AuthService.signUp: Signup completed successfully", {
        userId: minimalUser.id,
        needsVerification: !data.session,
      });

      return {
        user: minimalUser,
        needsVerification: !data.session,
      };
    } catch (error) {
      logger.error("AuthService.signUp: Signup failed", error);
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
        if (error.message.includes("Auth session missing")) {
          logger.log("No active session to sign out from");
          return;
        }
        throw new Error(error.message);
      }
    } catch (error: any) {
      // If there's no active session, that's actually fine for sign out
      if (error.message && error.message.includes("Auth session missing")) {
        logger.log("No active session to sign out from");
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
      redirectTo: "tattoola://(auth)/reset-password",
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
  static async completeUserRegistration(
    data: CompleteUserRegistration
  ): Promise<User> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error("No authenticated user found");
    }

    logger.log("complete user registration data:", data);

    const userId = session.session.user.id;

    logger.log("user id:", userId);

    // Ensure a row exists in users; insert if missing, otherwise update
    const { data: existingUser, error: existError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    logger.log("existing user:", existingUser);

    if (existError) {
      throw new Error(existError.message);
    }

    let updatedUser: any = null;
    if (!existingUser) {
      logger.log("inserting new user");
      // Insert new user row
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: session.session.user.email!,
          username:
            session.session.user.user_metadata?.username ||
            session.session.user.email!.split("@")[0],
          firstName: (data as any).step3.firstName,
          lastName: (data as any).step3.lastName,
          phone: (data as any).step3.phone,
          avatar: (data as any).step4.avatar,
          instagram: (data as any).step5.instagram,
          tiktok: (data as any).step5.tiktok,
          isPublic:
            (data as any).step7?.isPublic ??
            (data as any).step6?.isPublic ??
            true,
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
      logger.log("updating existing user");
      // Update existing user row
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({
          firstName: (data as any).step3.firstName,
          lastName: (data as any).step3.lastName,
          phone: (data as any).step3.phone,
          avatar: (data as any).step4.avatar,
          instagram: (data as any).step5.instagram,
          tiktok: (data as any).step5.tiktok,
          isPublic:
            (data as any).step7?.isPublic ??
            (data as any).step6?.isPublic ??
            true,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      logger.log("updated user:", updated);

      if (updateError) {
        throw new Error(updateError.message);
      }
      updatedUser = updated;
    }

    logger.log("Now adding locations");
    // Create primary user location
    if (
      (data as any).step3?.provinceId &&
      (data as any).step3?.municipalityId
    ) {
      const locationAddress = buildGoogleMapsUrl(
        (data as any).step3.municipality,
        (data as any).step3.province
      );
      logger.log("location address:", locationAddress);
      logger.log("province id:", (data as any).step3.provinceId);
      logger.log("municipality id:", (data as any).step3.municipalityId);
      await supabase.from("user_locations").insert({
        id: generateUUID(),
        userId: userId,
        provinceId: (data as any).step3.provinceId,
        municipalityId: (data as any).step3.municipalityId,
        address: locationAddress,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    logger.log("Now adding favorite styles");

    // Add favorite styles - validate against existing tattoo_styles and avoid duplicates
    const favoriteStyles: string[] =
      (data as any).step6?.favoriteStyles ||
      (data as any).step5?.favoriteStyles ||
      [];
    if (favoriteStyles.length > 0) {
      const uniqueRequestedStyleIds = Array.from(
        new Set(favoriteStyles.filter(Boolean))
      );

      // Validate that requested style IDs exist to satisfy FK constraint
      const { data: validStyles, error: validStylesError } = await supabase
        .from("tattoo_styles")
        .select("id")
        .in("id", uniqueRequestedStyleIds);

      if (validStylesError) {
        throw new Error(validStylesError.message);
      }

      const validStyleIds = (validStyles || []).map((s) => s.id);

      if (validStyleIds.length > 0) {
        // Optional: clear existing to avoid unique violations on re-run
        await supabase
          .from("user_favorite_styles")
          .delete()
          .eq("userId", userId);

        const favoriteStylesData = validStyleIds.map((styleId, index) => ({
          userId: userId,
          styleId: styleId,
          order: index,
        }));

        const { error: stylesError } = await supabase
          .from("user_favorite_styles")
          .insert(favoriteStylesData);

        logger.log("stylesError:", stylesError);
        logger.log("favoriteStylesData:", favoriteStylesData);

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
  static async completeArtistRegistration(
    data: CompleteArtistRegistration
  ): Promise<User> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error("No authenticated user found");
    }

    logger.log("saving artist profile with this data:", data);

    const userId = session.session.user.id;

    logger.log("user id:", userId);

    // Ensure a users row exists for this auth user
    const email = session.session.user.email || "";
    
    // Check if user exists by ID first
    const { data: existingUserById, error: existUserByIdError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    logger.log("existing user by id:", existingUserById);

    if (existUserByIdError) {
      throw new Error(existUserByIdError.message);
    }

    let baseUserRow: any = existingUserById;
    
    // If user doesn't exist by ID, check by email (in case email exists from previous registration)
    if (!baseUserRow && email) {
      const { data: existingUserByEmail, error: existUserByEmailError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      logger.log("existing user by email:", existingUserByEmail);

      if (existUserByEmailError && !existUserByEmailError.message.includes("No rows")) {
        throw new Error(existUserByEmailError.message);
      }

      // If user exists by email, use that user (even if ID doesn't match auth user ID)
      // This handles cases where user was created previously but auth user ID changed
      if (existingUserByEmail) {
        logger.log("User exists by email, will update existing user record");
        baseUserRow = existingUserByEmail;
      }
    }

    // If still no user found, create new one
    if (!baseUserRow) {
      const username =
        session.session.user.user_metadata?.username ||
        email.split("@")[0] ||
        "user";
      const now = new Date().toISOString();

      const { data: insertedUser, error: insertUserError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email,
          username,
          firstName: data.step3.firstName,
          lastName: data.step3.lastName,
          avatar: data.step3.avatar,
          bio: data.step7.bio,
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
        // If insert fails due to duplicate email, fetch and update existing user
        if (insertUserError.message.includes("duplicate key") && insertUserError.message.includes("email")) {
          logger.log("Duplicate email detected, fetching and updating existing user");
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

          if (fetchError || !existingUser) {
            throw new Error("User with this email already exists but could not be retrieved. Please contact support.");
          }

          // Update the existing user with new registration data
          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({
              firstName: data.step3.firstName,
              lastName: data.step3.lastName,
              avatar: data.step3.avatar,
              bio: data.step7.bio,
              instagram: data.step7.instagram,
              tiktok: data.step7.tiktok,
              role: UserRole.ARTIST,
              isActive: true,
              isVerified: !!session.session.user.email_confirmed_at,
              updatedAt: new Date().toISOString(),
            })
            .eq("id", existingUser.id)
            .select()
            .single();

          if (updateError) {
            logger.log("Error updating existing user:", updateError);
            // Fall back to existing user if update fails
            baseUserRow = existingUser;
          } else {
            baseUserRow = updatedUser;
          }
        } else {
          throw new Error(insertUserError.message);
        }
      } else {
        baseUserRow = insertedUser;
      }
    }

    logger.log("base user row:", baseUserRow);
    logger.log("Updating user profile with this data:", data);

    // Use the actual user ID from baseUserRow (might differ from auth userId if user was found by email)
    const actualUserId = baseUserRow.id;

    // Update user profile
    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update({
        firstName: data.step3.firstName,
        lastName: data.step3.lastName,
        avatar: data.step3.avatar,
        bio: data.step7.bio,
        instagram: data.step7.instagram,
        tiktok: data.step7.tiktok,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", actualUserId)
      .select()
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    logger.log("updated user:", updatedUser);

    // Check if artist profile already exists
    const { data: existingArtistProfile, error: existArtistError } =
      await supabase
        .from("artist_profiles")
        .select("id")
        .eq("userId", actualUserId)
        .maybeSingle();

    logger.log("existing artist profile:", existingArtistProfile);

    if (existArtistError) {
      throw new Error(existArtistError.message);
    }

    // Create or update artist profile
    const adminOrUserClient = supabase;
    const now2 = new Date().toISOString();

    let artistProfile: any = null;
    if (!existingArtistProfile) {
      // Insert new artist profile
      logger.log("inserting new artist profile");
      const { data: insertedProfile, error: artistError } =
        await adminOrUserClient
          .from("artist_profiles")
          .insert({
            id: generateUUID(), // Generate UUID for the artist profile
            userId: actualUserId,
            workArrangement: data.step4.workArrangement,
            artistType:
              data.step4.workArrangement === "STUDIO_OWNER"
                ? "STUDIO_OWNER"
                : data.step4.workArrangement === "STUDIO_EMPLOYEE"
                  ? "STUDIO_EMPLOYEE"
                  : "FREELANCE",
            businessName: data.step5.studioName,
            studioAddress: data.step5.studioAddress,
            phone: data.step5.phone,
            website: data.step5.website,
            certificateUrl: data.step6.certificateUrl,
            instagram: data.step7.instagram,
            minimumPrice: data.step11.minimumPrice,
            hourlyRate: data.step11.hourlyRate,
            isStudioOwner: data.step4.workArrangement === "STUDIO_OWNER",
            portfolioComplete: false, // Will be set to true after portfolio projects are added
            createdAt: now2,
            updatedAt: now2,
          })
          .select()
          .single();

      if (artistError) {
        throw new Error(artistError.message);
      }

      artistProfile = insertedProfile;
      logger.log("artist profile created");
    } else {
      // Update existing artist profile
      logger.log("updating existing artist profile");
      const { data: updatedProfile, error: artistError } =
        await adminOrUserClient
          .from("artist_profiles")
          .update({
            workArrangement: data.step4.workArrangement,
            artistType:
              data.step4.workArrangement === "STUDIO_OWNER"
                ? "STUDIO_OWNER"
                : data.step4.workArrangement === "STUDIO_EMPLOYEE"
                  ? "STUDIO_EMPLOYEE"
                  : "FREELANCE",
            businessName: data.step5.studioName,
            studioAddress: data.step5.studioAddress,
            website: data.step5.website,
            phone: data.step5.phone,
            certificateUrl: data.step6.certificateUrl,
            instagram: data.step7.instagram,
            minimumPrice: data.step11.minimumPrice,
            hourlyRate: data.step11.hourlyRate,
            isStudioOwner: data.step4.workArrangement === "STUDIO_OWNER",
            updatedAt: now2,
          })
          .eq("id", existingArtistProfile.id)
          .select()
          .single();

      if (artistError) {
        throw new Error(artistError.message);
      }

      artistProfile = updatedProfile;
      logger.log("artist profile updated");
    }

    // Create primary location for artist using studio location
    if (data.step5.provinceId && data.step5.municipalityId) {
      const locationAddress = buildGoogleMapsUrl(
        data.step5.municipality,
        data.step5.province
      );

      await adminOrUserClient.from("user_locations").insert({
        id: generateUUID(),
        userId: actualUserId,
        provinceId: data.step5.provinceId,
        municipalityId: data.step5.municipalityId,
        address: locationAddress,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Create or update studio + membership if studio owner
    let createdStudio: any = null;
    if (data.step4.workArrangement === "STUDIO_OWNER") {
      // Check if studio already exists for this artist
      const { data: existingStudio, error: existStudioError } =
        await adminOrUserClient
          .from("studios")
          .select("id, slug")
          .eq("ownerId", artistProfile.id)
          .maybeSingle();

      logger.log("existing studio:", existingStudio);

      if (existStudioError) {
        throw new Error(existStudioError.message);
      }

      if (existingStudio) {
        // Update existing studio
        logger.log("updating existing studio");
        const { data: updatedStudio, error: updateStudioError } =
          await adminOrUserClient
            .from("studios")
            .update({
              name: data.step5.studioName,
              address: data.step5.studioAddress,
              phone: data.step5.phone,
              website: data.step5.website,
              updatedAt: now2,
            })
            .eq("id", existingStudio.id)
            .select()
            .single();

        if (updateStudioError) {
          throw new Error(updateStudioError.message);
        }

        createdStudio = updatedStudio;
        logger.log("studio updated");

        // Check if studio member already exists
        const { data: existingMember } = await adminOrUserClient
          .from("studio_members")
          .select("id")
          .eq("studioId", createdStudio.id)
          .eq("userId", actualUserId)
          .maybeSingle();

        if (!existingMember) {
          // Create studio member if doesn't exist
          await adminOrUserClient.from("studio_members").insert({
            id: generateUUID(),
            studioId: createdStudio.id,
            userId: actualUserId,
            artistId: artistProfile.id,
            role: "OWNER",
            isActive: true,
            status: "ACCEPTED",
            invitedAt: now2,
            acceptedAt: now2,
            joinedAt: now2,
            invitationToken: null,
          });
          logger.log("studio member created");
        } else {
          // Ensure existing membership is active and accepted
          await adminOrUserClient
            .from("studio_members")
            .update({
              role: "OWNER",
              isActive: true,
              status: "ACCEPTED",
              acceptedAt: now2,
              joinedAt: now2,
              invitationToken: null,
            })
            .eq("id", existingMember.id);
          logger.log("studio member already exists");
        }
      } else {
        // Create new studio
        logger.log("creating new studio");
        const slugBase = (data.step5.studioName || "studio")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        let slug = slugBase;
        for (let i = 0; i < 3; i++) {
          const { data: studio, error: studioError } = await adminOrUserClient
            .from("studios")
            .insert({
              id: generateUUID(),
              name: data.step5.studioName,
              slug,
              address: data.step5.studioAddress,
              phone: data.step5.phone,
              website: data.step5.website,
              ownerId: artistProfile.id,
              createdAt: now2,
              updatedAt: now2,
            })
            .select()
            .single();
          if (!studioError) {
            createdStudio = studio;
            break;
          }
          if ((studioError.message || "").toLowerCase().includes("duplicate"))
            slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
          else throw new Error(studioError.message);
        }

        if (createdStudio) {
          await adminOrUserClient.from("studio_members").insert({
            id: generateUUID(),
            studioId: createdStudio.id,
            userId: actualUserId,
            artistId: artistProfile.id,
            role: "OWNER",
            isActive: true,
            status: "ACCEPTED",
            invitedAt: now2,
            acceptedAt: now2,
            joinedAt: now2,
            invitationToken: null,
          });
          logger.log("studio and member created");
        }
      }
    }

    logger.log("creating artist styles");

    // Add artist styles - validate against existing tattoo_styles and avoid duplicates.
    // favoriteStyles is a subset of styles that should be marked as favourite.
    const allStyles = data.step8.styles || [];
    const favouriteStyleIds = data.step8.favoriteStyles || [];

    logger.log("Processing artist styles:", {
      allStyles,
      favouriteStyleIds,
    });

    if (allStyles.length > 0) {
      const uniqueRequestedStyleIds = Array.from(
        new Set(allStyles.filter(Boolean))
      );
      logger.log("Unique requested style IDs:", uniqueRequestedStyleIds);

      const { data: validStyles, error: validStylesError } = await supabase
        .from("tattoo_styles")
        .select("id")
        .in("id", uniqueRequestedStyleIds);

      logger.log("Valid styles query result:", {
        validStyles,
        validStylesError,
      });
      if (validStylesError) {
        throw new Error(validStylesError.message);
      }

      const validStyleIds = (validStyles || []).map((s) => s.id);
      logger.log("Valid style IDs to insert:", validStyleIds);

      if (validStyleIds.length > 0) {
        // Optional: clear existing to avoid unique violations on re-run
        await supabase
          .from("artist_styles")
          .delete()
          .eq("artistId", artistProfile.id);

        const stylesData = validStyleIds.map((styleId, index) => ({
          artistId: artistProfile.id,
          styleId: styleId,
          order: index,
          isFavorite: favouriteStyleIds.includes(styleId),
        }));

        const { error: stylesError } = await supabase
          .from("artist_styles")
          .insert(stylesData);

        if (stylesError) {
          throw new Error(stylesError.message);
        }
      }
    }

    logger.log("adding services");

    // Add services - let Supabase generate UUIDs
    if (data.step9.servicesOffered && data.step9.servicesOffered.length > 0) {
      const servicesData = data.step9.servicesOffered.map((serviceId) => ({
        artistId: artistProfile.id,
        serviceId: serviceId,
      }));

      const { error: servicesError } = await supabase
        .from("artist_services")
        .insert(servicesData);

      if (servicesError) {
        throw new Error(servicesError.message);
      }
    }

    logger.log("adding body parts");

    // Add body parts - let Supabase generate UUIDs
    if (data.step10.bodyParts && data.step10.bodyParts.length > 0) {
      const bodyPartsData = data.step10.bodyParts.map((bodyPartId) => ({
        artistId: artistProfile.id,
        bodyPartId: bodyPartId,
      }));

      const { error: bodyPartsError } = await supabase
        .from("artist_body_parts")
        .insert(bodyPartsData);

      if (bodyPartsError) {
        throw new Error(bodyPartsError.message);
      }
    }

    logger.log("adding portfolio projects");

    // Add portfolio projects from step12
    logger.log("step12 projects:", data.step12?.projects);

    const projects = data.step12?.projects || [];
    const createdProjectRefs: { id: string; project: any }[] = [];

    logger.log("filtered projects:", projects);

    if (projects.length > 0) {
      let projectOrder = 1;
      for (const project of projects) {
        logger.log("Processing project:", {
          title: project.title,
          description: project.description,
        });

        // Skip if no title and no description
        if (!project.title && !project.description) {
          logger.log("Skipping project - no title or description");
          continue;
        }

        // Use title if available, otherwise use description or a default
        const projectTitle =
          project.title ||
          project.description ||
          `Portfolio Project ${projectOrder}`;
        logger.log("Using project title:", projectTitle);

        const { data: portfolioProject, error: projectError } =
          await adminOrUserClient
            .from("portfolio_projects")
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

        logger.log(
          "Portfolio project created successfully:",
          portfolioProject.id
        );

        // Track created project id alongside original payload for later post creation
        createdProjectRefs.push({ id: portfolioProject.id, project });

        // Add project media - let Supabase generate UUIDs
        const allMedia = [
          ...(project.photos || []).map((url: string) => ({
            url,
            type: "IMAGE",
          })),
          ...(project.videos || []).map((url: string) => ({
            url,
            type: "VIDEO",
          })),
        ];

        if (allMedia.length > 0) {
          const mediaData = allMedia.map((media, mediaIndex) => ({
            projectId: portfolioProject.id,
            mediaType: media.type,
            mediaUrl: media.url,
            order: mediaIndex + 1,
          }));

          const { error: mediaError } = await adminOrUserClient
            .from("portfolio_project_media")
            .insert(mediaData);

          if (mediaError) {
            throw new Error(mediaError.message);
          }
        }

        // Add project styles - let Supabase generate UUIDs
        if (project.associatedStyles && project.associatedStyles.length > 0) {
          const projectStylesData = project.associatedStyles.map(
            (styleId: string) => ({
              projectId: portfolioProject.id,
              styleId: styleId,
            })
          );

          const { error: projectStylesError } = await adminOrUserClient
            .from("portfolio_project_styles")
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
          .from("artist_profiles")
          .update({ portfolioComplete: true })
          .eq("id", artistProfile.id);
      }
    }

    logger.log("portfolio projects added");

    // Create artist banner from first images of each portfolio project
    logger.log("Creating artist banner from portfolio projects");
    const bannerMediaUrls: string[] = [];

    if (projects.length > 0) {
      for (const project of projects) {
        // Get the first image from each project
        const firstImage = project.photos?.[0];
        if (firstImage) {
          bannerMediaUrls.push(firstImage);
        }
      }

      // Insert banner media if we have any
      if (bannerMediaUrls.length > 0) {
        const bannerMediaData = bannerMediaUrls.map((url, index) => ({
          artistId: artistProfile.id,
          mediaType: "IMAGE" as const,
          mediaUrl: url,
          bannerType: "FOUR_IMAGES",
          order: index,
        }));

        const { error: bannerError } = await adminOrUserClient
          .from("artist_banner_media")
          .insert(bannerMediaData);

        if (bannerError) {
          logger.error("Error creating banner media:", bannerError);
          // Don't throw error, just log it as banner is not critical
        } else {
          logger.log("Artist banner media created successfully");

          // Set bannerType to FOUR_IMAGES in artist_profiles
          const { error: updateBannerTypeError } = await adminOrUserClient
            .from("artist_profiles")
            .update({ bannerType: "FOUR_IMAGES" })
            .eq("id", artistProfile.id);

          if (updateBannerTypeError) {
            logger.error("Error setting bannerType:", updateBannerTypeError);
          } else {
            logger.log("Banner type set to FOUR_IMAGES");
          }
        }
      }
    }

    // Create studio banner from first images of each portfolio project
    if (createdStudio && bannerMediaUrls.length > 0) {
      logger.log("Creating studio banner from portfolio projects");

      const studioBannerMediaData = bannerMediaUrls.map((url, index) => ({
        studioId: createdStudio.id,
        mediaType: "IMAGE" as const,
        mediaUrl: url,
        bannerType: "FOUR_IMAGES",
        order: index,
      }));

      const { error: studioBannerError } = await adminOrUserClient
        .from("studio_banner_media")
        .insert(studioBannerMediaData);

      if (studioBannerError) {
        logger.error("Error creating studio banner media:", studioBannerError);
      } else {
        logger.log("Studio banner media created successfully");

        // Set bannerType to FOUR_IMAGES in studios table
        const { error: updateStudioBannerTypeError } = await adminOrUserClient
          .from("studios")
          .update({ bannerType: "FOUR_IMAGES" })
          .eq("id", createdStudio.id);

        if (updateStudioBannerTypeError) {
          logger.error(
            "Error setting studio bannerType:",
            updateStudioBannerTypeError
          );
        } else {
          logger.log("Studio banner type set to FOUR_IMAGES");
        }
      }
    }

    // Create portfolio collection
    logger.log("Creating portfolio collection");
    const { data: portfolioCollection, error: collectionError } =
      await adminOrUserClient
        .from("collections")
        .insert({
          id: generateUUID(),
          name: `${data.step3.firstName} ${data.step3.lastName}'s Portfolio`,
          description: "Portfolio works",
          ownerId: userId,
          isPrivate: false,
          isPortfolioCollection: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

    if (collectionError) {
      logger.error("Error creating portfolio collection:", collectionError);
      // Don't throw error, just log it as collection is not critical
    } else {
      logger.log("Portfolio collection created successfully");
    }

    // Create posts for each portfolio project
    logger.log("Creating portfolio posts");
    if (projects.length > 0 && portfolioCollection) {
      let postOrder = 1;
      // Use createdProjectRefs so we have the DB projectId for each post
      for (const ref of createdProjectRefs) {
        const project = ref.project;
        // Skip if no media
        const hasMedia =
          (project.photos && project.photos.length > 0) ||
          (project.videos && project.videos.length > 0);
        if (!hasMedia) {
          logger.log("Skipping project - no media");
          continue;
        }

        const projectTitle =
          project.title || project.description || `Portfolio Work ${postOrder}`;
        const thumbnailUrl = project.photos?.[0] || project.videos?.[0];

        // Create post
        const firstFavoriteStyle = (data.step8.favoriteStyles || [])[0] || null;
        const { data: post, error: postError } = await adminOrUserClient
          .from("posts")
          .insert({
            id: generateUUID(),
            authorId: userId,
            caption: project.description || project.title,
            thumbnailUrl: thumbnailUrl,
            styleId: firstFavoriteStyle || null,
            projectId: ref.id,
            isActive: true,
            likesCount: 0,
            commentsCount: 0,
            showInFeed: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (postError) {
          logger.error("Error creating post:", postError);
          continue; // Skip this post but continue with others
        }

        logger.log("Post created successfully:", post.id);

        // Add post media
        const allMedia = [
          ...(project.photos || []).map((url: string) => ({
            url,
            type: "IMAGE" as const,
          })),
          ...(project.videos || []).map((url: string) => ({
            url,
            type: "VIDEO" as const,
          })),
        ];

        if (allMedia.length > 0) {
          const postMediaData = allMedia.map((media, mediaIndex) => ({
            postId: post.id,
            mediaType: media.type,
            mediaUrl: media.url,
            order: mediaIndex + 1,
          }));

          const { error: postMediaError } = await adminOrUserClient
            .from("post_media")
            .insert(postMediaData);

          if (postMediaError) {
            logger.error("Error creating post media:", postMediaError);
          }
        }

        // Add post to portfolio collection
        const { error: collectionPostError } = await adminOrUserClient
          .from("collection_posts")
          .insert({
            id: generateUUID(),
            collectionId: portfolioCollection.id,
            postId: post.id,
            addedAt: new Date().toISOString(),
          });

        if (collectionPostError) {
          logger.error("Error adding post to collection:", collectionPostError);
        }

        postOrder++;
      }
    }

    return this.transformDatabaseUser(updatedUser);
  }

  /**
   * Get current user profile
   */
  static async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        artist_profiles(
          *,
          artist_banner_media(*)
        ),
        user_favorite_styles(
          styleId,
          order,
          tattoo_styles(*)
        )
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.transformDatabaseUser(data);
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId)
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
  static async resendVerificationEmail(email?: string): Promise<void> {
    // If email is not provided, try to use the current session's user email
    let targetEmail = email;
    if (!targetEmail) {
      const { data } = await supabase.auth.getUser();
      targetEmail = data?.user?.email ?? undefined;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<void> {
    logger.log("AuthService.verifyEmail: Starting email verification", {
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 10) + "...",
    });

    try {
      // For email verification, we need to use the token directly
      // The token from Supabase email contains all necessary information
      logger.log("AuthService.verifyEmail: Calling supabase.auth.verifyOtp");
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });

      logger.log("AuthService.verifyEmail: Supabase verifyOtp response", {
        hasError: !!error,
        errorMessage: error?.message,
      });

      if (error) {
        logger.error("AuthService.verifyEmail: Verification failed", error);
        throw new Error(error.message);
      }

      logger.log("AuthService.verifyEmail: Email verified successfully");

      // Update user verification status
      logger.log("AuthService.verifyEmail: Getting current session");
      const { data: session } = await supabase.auth.getSession();

      if (session?.session?.user) {
        logger.log(
          "AuthService.verifyEmail: Updating user verification status",
          {
            userId: session.session.user.id,
          }
        );
        await supabase
          .from("users")
          .update({ isVerified: true })
          .eq("id", session.session.user.id);
        logger.log("AuthService.verifyEmail: User verification status updated");
      } else {
        logger.warn(
          "AuthService.verifyEmail: No session found after verification"
        );
      }
    } catch (error) {
      logger.error("AuthService.verifyEmail: Email verification failed", error);
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
      instagram: dbUser.instagram,
      tiktok: dbUser.tiktok,
      isActive: dbUser.isActive,
      isVerified: dbUser.isVerified,
      isPublic: dbUser.isPublic,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      lastLoginAt: dbUser.lastLoginAt,
      artistProfile: dbUser.artist_profiles
        ? {
            id: dbUser.artist_profiles.id,
            userId: dbUser.artist_profiles.userId,
            certificateUrl: dbUser.artist_profiles.certificateUrl,
            portfolioComplete: dbUser.artist_profiles.portfolioComplete,
            yearsExperience: dbUser.artist_profiles.yearsExperience,
            specialties: dbUser.artist_profiles.specialties,
            businessName: dbUser.artist_profiles.businessName,
            studioAddress: dbUser.artist_profiles.studioAddress,
            instagram: dbUser.artist_profiles.instagram,
            website: dbUser.artist_profiles.website,
            phone: dbUser.artist_profiles.phone,
            workArrangement: dbUser.artist_profiles.workArrangement,
            isStudioOwner: dbUser.artist_profiles.isStudioOwner,
            minimumPrice: dbUser.artist_profiles.minimumPrice,
            hourlyRate: dbUser.artist_profiles.hourlyRate,
            coverPhoto: dbUser.artist_profiles.coverPhoto,
            coverVideo: dbUser.artist_profiles.coverVideo,
            bannerMedia: dbUser.artist_profiles.artist_banner_media || [],
            createdAt: dbUser.artist_profiles.createdAt,
            updatedAt: dbUser.artist_profiles.updatedAt,
          }
        : undefined,
    };
  }
}
