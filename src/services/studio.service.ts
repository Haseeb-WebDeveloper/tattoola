import {
  StudioSetupStep1,
  StudioSetupStep2,
  StudioSetupStep3,
  StudioSetupStep4,
  StudioSetupStep5,
  StudioSetupStep6,
  StudioSetupStep7,
  StudioSetupStep8,
} from "@/stores/studioSetupStore";
import { StudioInfo } from "@/types/studio";
import { generateUUID } from "@/utils/randomUUIDValue";
import { supabase } from "@/utils/supabase";

/**
 * Fetch studio information for an artist user
 * Returns studio details and user's role in the studio
 */
export async function fetchArtistStudio(userId: string): Promise<StudioInfo | null> {
  try {
    // 1. Get artist profile for the user
    const { data: artistProfile, error: artistError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (artistError || !artistProfile) {
      console.error('Error fetching artist profile:', artistError);
      return null;
    }

    // 2. Query studios table where ownerId = artistProfile.id
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .select('id, name, isCompleted, ownerId')
      .eq('ownerId', artistProfile.id)
      .single();

    if (studioError || !studio) {
      console.error('Error fetching studio:', studioError);
      return null;
    }

    // 3. Check if user is owner or get role from studio_members
    let userRole: 'OWNER' | 'MANAGER' | 'MEMBER' = 'OWNER'; // Owner by default since we queried by ownerId

    // If not owner, check studio_members table
    if (studio.ownerId !== artistProfile.id) {
      const { data: memberData, error: memberError } = await supabase
        .from('studio_members')
        .select('role')
        .eq('studioId', studio.id)
        .eq('userId', userId)
        .single();

      if (memberError || !memberData) {
        console.error('Error fetching studio member role:', memberError);
        return null;
      }

      userRole = memberData.role as 'OWNER' | 'MANAGER' | 'MEMBER';
    }

    // 4. Return studio info with role
    return {
      id: studio.id,
      name: studio.name,
      isCompleted: studio.isCompleted,
      userRole,
    };
  } catch (error) {
    console.error('Error in fetchArtistStudio:', error);
    return null;
  }
}

/**
 * Create or update a studio with all setup data
 */
export async function saveStudioSetup(
  userId: string,
  step1: StudioSetupStep1,
  step2: StudioSetupStep2,
  step3: StudioSetupStep3,
  step4: StudioSetupStep4,
  step5: StudioSetupStep5,
  step6: StudioSetupStep6,
  step7: StudioSetupStep7,
  step8: StudioSetupStep8
): Promise<{ success: boolean; studioId?: string; error?: string }> {
  try {
    // 1. Get artist profile
    const { data: artistProfile, error: artistError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (artistError || !artistProfile) {
      throw new Error('Artist profile not found');
    }

    const artistId = artistProfile.id;

    // 2. Check if studio already exists for this artist
    const { data: existingStudio, error: checkError } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistId)
      .maybeSingle();

    let studioId: string;

    if (existingStudio) {
      // Update existing studio
      studioId = existingStudio.id;

      const { error: updateError } = await supabase
        .from('studios')
        .update({
          name: step3.name,
          logo: step2.logoUrl,
          bannerType: step1.bannerType,
          address: step3.address,
          website: step4.website,
          instagram: step4.instagram,
          description: step5.description,
          isCompleted: true,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', studioId);

      if (updateError) throw new Error(`Failed to update studio: ${updateError.message}`);

      // Update studio location
      const { data: existingLocation } = await supabase
        .from('studio_locations')
        .select('id')
        .eq('studioId', studioId)
        .eq('isPrimary', true)
        .maybeSingle();

      if (existingLocation) {
        // Update existing location
        await supabase
          .from('studio_locations')
          .update({
            provinceId: step3.provinceId,
            municipalityId: step3.municipalityId,
            address: step3.address,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingLocation.id);
      } else {
        // Create new location
        await supabase
          .from('studio_locations')
          .insert({
            id: generateUUID(),
            studioId,
            provinceId: step3.provinceId,
            municipalityId: step3.municipalityId,
            address: step3.address,
            isPrimary: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
      }
    } else {
      // Create new studio
      // Generate slug from studio name with random suffix for uniqueness
      const baseSlug = step3.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;

      // Generate studio ID
      studioId = generateUUID();

      const { error: createError } = await supabase
        .from('studios')
        .insert({
          id: studioId,
          ownerId: artistId,
          name: step3.name,
          slug: slug,
          logo: step2.logoUrl,
          bannerType: step1.bannerType,
          address: step3.address,
          website: step4.website,
          instagram: step4.instagram,
          tiktok: step4.tiktok,
          description: step5.description,
          isCompleted: true,
          updatedAt: new Date().toISOString(),
        });

      if (createError) {
        throw new Error(`Failed to create studio: ${createError?.message}`);
      }

      // Create studio location
      const { error: locationError } = await supabase
        .from('studio_locations')
        .insert({
          id: generateUUID(),
          studioId,
          provinceId: step3.provinceId,
          municipalityId: step3.municipalityId,
          address: step3.address,
          isPrimary: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (locationError) {
        console.error('Failed to create studio location:', locationError);
      }

      // Add owner as studio member
      const { error: memberError } = await supabase
        .from('studio_members')
        .insert({
          id: generateUUID(),
          studioId,
          userId,
          artistId, // artistId is required by schema
          role: 'OWNER',
          joinedAt: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Failed to add owner as studio member:', memberError);
      }
    }

    // 3. Handle studio banner images (delete existing and insert new)
    if (step1.bannerImages.length > 0) {
      // Delete existing banner media
      await supabase
        .from('studio_banner_media')
        .delete()
        .eq('studioId', studioId);

      // Insert new banner media
      const { error: bannerError } = await supabase
        .from('studio_banner_media')
        .insert(
          step1.bannerImages.map((imageUrl, index) => ({
            studioId,
            mediaType: 'IMAGE',
            bannerType: step1.bannerType,
            mediaUrl: imageUrl,
            order: index,
          }))
        );

      if (bannerError) {
        console.error('Failed to save studio banner media:', bannerError);
      }
    }

    // 4. Handle studio styles (delete existing and insert new)
    if (step6.styleIds.length > 0) {
      // Delete existing styles
      await supabase
        .from('studio_styles')
        .delete()
        .eq('studioId', studioId);

      // Insert new styles
      const { error: stylesError } = await supabase
        .from('studio_styles')
        .insert(
          step6.styleIds.map((styleId) => ({
            studioId,
            styleId,
          }))
        );

      if (stylesError) {
        console.error('Failed to save studio styles:', stylesError);
      }
    }

    // 5. Handle studio services (delete existing and insert new)
    if (step7.serviceIds.length > 0) {
      // Delete existing services
      await supabase
        .from('studio_services')
        .delete()
        .eq('studioId', studioId);

      // Insert new services
      const { error: servicesError } = await supabase
        .from('studio_services')
        .insert(
          step7.serviceIds.map((serviceId) => ({
            studioId,
            serviceId,
          }))
        );

      if (servicesError) {
        console.error('Failed to save studio services:', servicesError);
      }
    }

    // 6. Handle studio FAQs (delete existing and insert new)
    // Delete existing FAQs
    console.log('Deleting existing FAQs');
    await supabase
      .from('studio_faqs')
      .delete()
      .eq('studioId', studioId);

    console.log('Inserting new FAQs');
    if (step8.faqs.length > 0) {
      console.log('Inserting new FAQs', step8.faqs);
      // Insert new FAQs
      const { error: faqsError } = await supabase
        .from('studio_faqs')
        .insert(
          step8.faqs.map((faq, index) => ({
            id: generateUUID(),
            studioId,
            question: faq.question,
            answer: faq.answer,
            order: index,
            updatedAt: new Date().toISOString(),
          }))
        );

      console.log('Failed to save studio FAQs:', faqsError);
      if (faqsError) {
        console.error('Failed to save studio FAQs:', faqsError);
      }
    }

    return { success: true, studioId };
  } catch (error: any) {
    console.error('Error in saveStudioSetup:', error);
    return { success: false, error: error.message || 'Failed to save studio' };
  }
}

/**
 * Fetch full studio details for editing
 */
export async function fetchStudioDetails(userId: string) {
  try {
    // Get artist profile
    const { data: artistProfile, error: artistError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (artistError || !artistProfile) {
      throw new Error('Artist profile not found');
    }

    // Get studio with all details
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .select(`
        id,
        name,
        logo,
        bannerType,
        address,
        website,
        instagram,
        tiktok,
        description
      `)
      .eq('ownerId', artistProfile.id)
      .single();

    if (studioError || !studio) {
      throw new Error('Studio not found');
    }

    // Get studio location
    const { data: location } = await supabase
      .from('studio_locations')
      .select(`
        provinceId,
        municipalityId,
        address,
        province:provinces(id, name),
        municipality:municipalities(id, name)
      `)
      .eq('studioId', studio.id)
      .eq('isPrimary', true)
      .maybeSingle();

    // Get banner media
    const { data: bannerMedia } = await supabase
      .from('studio_banner_media')
      .select('mediaUrl, order')
      .eq('studioId', studio.id)
      .order('order');

    // Get styles
    const { data: styles } = await supabase
      .from('studio_styles')
      .select(`
        styleId,
        style:tattoo_styles(id, name, imageUrl)
      `)
      .eq('studioId', studio.id);

    // Get services
    const { data: services } = await supabase
      .from('studio_services')
      .select(`
        serviceId,
        service:services(id, name, category)
      `)
      .eq('studioId', studio.id);

    // Get FAQs
    const { data: faqs } = await supabase
      .from('studio_faqs')
      .select('id, question, answer, order')
      .eq('studioId', studio.id)
      .order('order');

    return {
      ...studio,
      city: (location?.municipality as any)?.name || '',
      provinceId: location?.provinceId || '',
      municipalityId: location?.municipalityId || '',
      province: (location?.province as any)?.name || '',
      municipality: (location?.municipality as any)?.name || '',
      bannerImages: bannerMedia?.map(m => m.mediaUrl) || [],
      styles: styles || [],
      services: services || [],
      faqs: faqs || [],
    };
  } catch (error: any) {
    console.error('Error in fetchStudioDetails:', error);
    throw error;
  }
}

/**
 * Update studio logo
 */
export async function updateStudioLogo(
  userId: string,
  logoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { error } = await supabase
      .from('studios')
      .update({ logo: logoUrl, updatedAt: new Date().toISOString() })
      .eq('ownerId', artistProfile.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio logo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update studio name and address
 */
export async function updateStudioNameAddress(
  userId: string,
  name: string,
  address: string,
  municipalityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    // Get studio ID
    const { data: studio } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistProfile.id)
      .single();

    if (!studio) throw new Error('Studio not found');

    // Update studio name and address
    const { error: studioError } = await supabase
      .from('studios')
      .update({
        name,
        address,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', studio.id);

    if (studioError) throw studioError;

    // Get municipality to find provinceId
    const { data: municipality } = await supabase
      .from('municipalities')
      .select('id, provinceId')
      .eq('id', municipalityId)
      .single();

    if (!municipality) throw new Error('Municipality not found');

    // Update or create studio location
    const { data: existingLocation } = await supabase
      .from('studio_locations')
      .select('id')
      .eq('studioId', studio.id)
      .eq('isPrimary', true)
      .maybeSingle();

    if (existingLocation) {
      // Update existing location
      const { error: locationError } = await supabase
        .from('studio_locations')
        .update({
          provinceId: municipality.provinceId,
          municipalityId: municipalityId,
          address: address,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingLocation.id);

      if (locationError) throw locationError;
    } else {
      // Create new location
      const { error: locationError } = await supabase
        .from('studio_locations')
        .insert({
          id: generateUUID(),
          studioId: studio.id,
          provinceId: municipality.provinceId,
          municipalityId: municipalityId,
          address: address,
          isPrimary: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (locationError) throw locationError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio name/address:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update studio social links
 */
export async function updateStudioSocial(
  userId: string,
  website?: string,
  instagram?: string,
  tiktok?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { error } = await supabase
      .from('studios')
      .update({
        website,
        instagram,
        tiktok,
        updatedAt: new Date().toISOString(),
      })
      .eq('ownerId', artistProfile.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio social:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update studio description
 */
export async function updateStudioDescription(
  userId: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { error } = await supabase
      .from('studios')
      .update({
        description,
        updatedAt: new Date().toISOString(),
      })
      .eq('ownerId', artistProfile.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio description:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update studio banner
 */
export async function updateStudioBanner(
  userId: string,
  bannerType: 'ONE_IMAGE' | 'FOUR_IMAGES',
  bannerImages: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { data: studio } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistProfile.id)
      .single();

    if (!studio) throw new Error('Studio not found');

    // Update banner type
    await supabase
      .from('studios')
      .update({ bannerType, updatedAt: new Date().toISOString() })
      .eq('id', studio.id);

    // Delete existing banner media
    await supabase
      .from('studio_banner_media')
      .delete()
      .eq('studioId', studio.id);

    // Insert new banner media
    if (bannerImages.length > 0) {
      const { error: bannerError } = await supabase
        .from('studio_banner_media')
        .insert(
          bannerImages.map((imageUrl, index) => ({
            studioId: studio.id,
            mediaType: 'IMAGE',
            bannerType: bannerType,
            mediaUrl: imageUrl,
            order: index,
          }))
        );

      if (bannerError) throw bannerError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio banner:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update studio styles
 */
export async function updateStudioStyles(
  userId: string,
  styleIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { data: studio } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistProfile.id)
      .single();

    if (!studio) throw new Error('Studio not found');

    // Delete existing styles
    await supabase
      .from('studio_styles')
      .delete()
      .eq('studioId', studio.id);

    // Insert new styles
    if (styleIds.length > 0) {
      const { error: stylesError } = await supabase
        .from('studio_styles')
        .insert(
          styleIds.map((styleId) => ({
            studioId: studio.id,
            styleId,
          }))
        );

      if (stylesError) throw stylesError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio styles:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update studio services
 */
export async function updateStudioServices(
  userId: string,
  serviceIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { data: studio } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistProfile.id)
      .single();

    if (!studio) throw new Error('Studio not found');

    // Delete existing services
    await supabase
      .from('studio_services')
      .delete()
      .eq('studioId', studio.id);

    // Insert new services
    if (serviceIds.length > 0) {
      const { error: servicesError } = await supabase
        .from('studio_services')
        .insert(
          serviceIds.map((serviceId) => ({
            studioId: studio.id,
            serviceId,
          }))
        );

      if (servicesError) throw servicesError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio services:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update studio FAQs
 */
export async function updateStudioFAQs(
  userId: string,
  faqs: Array<{ question: string; answer: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { data: studio } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistProfile.id)
      .single();

    if (!studio) throw new Error('Studio not found');

    // Delete existing FAQs
    await supabase
      .from('studio_faqs')
      .delete()
      .eq('studioId', studio.id);

    // Insert new FAQs
    if (faqs.length > 0) {
      const { error: faqsError } = await supabase
        .from('studio_faqs')
        .insert(
          faqs.map((faq, index) => ({
            id: generateUUID(),
            studioId: studio.id,
            question: faq.question,
            answer: faq.answer,
            order: index,
            updatedAt: new Date().toISOString(),
          }))
        );

      if (faqsError) throw faqsError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating studio FAQs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch public studio profile for display
 */
export async function fetchStudioPublicProfile(studioId: string) {
  try {
    console.log('🔍 Fetching studio profile for ID:', studioId);
    
    // Get studio basic info
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .select(`
        id,
        name,
        logo,
        bannerType,
        address,
        website,
        instagram,
        tiktok,
        description,
        ownerId
      `)
      .eq('id', studioId)
      .single();

    if (studioError) {
      console.error('❌ Studio fetch error:', studioError);
      console.error('Studio ID that failed:', studioId);
      throw new Error(`Studio not found: ${studioError.message}`);
    }

    if (!studio) {
      console.error('❌ No studio data returned for ID:', studioId);
      throw new Error('Studio not found');
    }

    console.log('✅ Studio found:', studio.name);

    // Get studio location
    const { data: studioLocation } = await supabase
      .from('studio_locations')
      .select(`
        provinceId,
        municipalityId,
        address,
        province:provinces(id, name),
        municipality:municipalities(id, name)
      `)
      .eq('studioId', studioId)
      .eq('isPrimary', true)
      .maybeSingle();

    // Get owner details through artist_profiles
    const { data: ownerProfile } = await supabase
      .from('artist_profiles')
      .select(`
        id,
        userId,
        user:users!artist_profiles_userId_fkey(firstName, lastName, avatar)
      `)
      .eq('id', studio.ownerId)
      .single();

    const owner = ownerProfile?.user || null;

    // Get banner media
    const { data: bannerMedia } = await supabase
      .from('studio_banner_media')
      .select('mediaUrl, mediaType, order')
      .eq('studioId', studioId)
      .order('order');

    // Get styles with style details
    const { data: styles } = await supabase
      .from('studio_styles')
      .select(`
        styleId,
        style:tattoo_styles(id, name, imageUrl)
      `)
      .eq('studioId', studioId);

    // Get services with service details
    const { data: services } = await supabase
      .from('studio_services')
      .select(`
        serviceId,
        service:services(id, name, category)
      `)
      .eq('studioId', studioId);

    // Get studio photos
    const { data: photos } = await supabase
      .from('studio_photos')
      .select('id, imageUrl, order')
      .eq('studioId', studioId)
      .order('order');

    // Get connected artists (studio members)
    const { data: members } = await supabase
      .from('studio_members')
      .select(`
        artistId,
        role,
        artist:artist_profiles!studio_members_artistId_fkey(
          id,
          userId,
          bio,
          experienceYears,
          user:users!artist_profiles_userId_fkey(
            id,
            firstName,
            lastName,
            avatar
          )
        )
      `)
      .eq('studioId', studioId);

    // For each artist, get their location, styles, and studio info
    const artistsWithDetails = await Promise.all(
      (members || []).map(async (member: any) => {
        if (!member.artist) return null;

        const userId = member.artist.user?.id;
        if (!userId) return null;

        // Get artist location
        const { data: location } = await supabase
          .from('artist_locations')
          .select(`
            locationId,
            location:locations(
              id,
              municipality:municipalities(name),
              province:provinces(name)
            )
          `)
          .eq('artistId', member.artist.id)
          .single();

        // Get artist styles
        const { data: artistStyles } = await supabase
          .from('artist_styles')
          .select(`
            styleId,
            style:tattoo_styles(id, name, imageUrl)
          `)
          .eq('artistId', member.artist.id)
          .limit(2);

        // Check if artist owns a studio
        const { data: ownedStudio } = await supabase
          .from('studios')
          .select('id, name')
          .eq('ownerId', member.artist.id)
          .maybeSingle();

        // Get artist banner
        const { data: artistBanner } = await supabase
          .from('artist_banner_media')
          .select('mediaUrl, mediaType, order')
          .eq('artistId', member.artist.id)
          .order('order')
          .limit(2);

        return {
          id: member.artist.id,
          userId: userId,
          firstName: member.artist.user?.firstName,
          lastName: member.artist.user?.lastName,
          avatar: member.artist.user?.avatar,
          experienceYears: member.artist.experienceYears,
          location: location?.location || null,
          styles: artistStyles?.map((s: any) => s.style) || [],
          ownedStudio: ownedStudio,
          banner: artistBanner || [],
          role: member.role,
        };
      })
    );

    // Get FAQs
    const { data: faqs } = await supabase
      .from('studio_faqs')
      .select('id, question, answer, order')
      .eq('studioId', studioId)
      .order('order');

    return {
      ...studio,
      city: (studioLocation?.municipality as any)?.name || '',
      province: (studioLocation?.province as any)?.name || '',
      country: 'Italy',
      owner: owner,
      banner: bannerMedia?.map((m: any) => ({
        mediaType: m.mediaType,
        mediaUrl: m.mediaUrl,
        order: m.order,
      })) || [],
      styles: styles?.map((s: any) => s.style).filter(Boolean) || [],
      services: services?.map((s: any) => s.service).filter(Boolean) || [],
      photos: photos || [],
      artists: artistsWithDetails.filter(Boolean) || [],
      faqs: faqs || [],
    };
  } catch (error: any) {
    console.error('Error in fetchStudioPublicProfile:', error);
    throw error;
  }
}

/**
 * Fetch studio photos for editing
 */
export async function fetchStudioPhotos(userId: string) {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { data: studio } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistProfile.id)
      .single();

    if (!studio) throw new Error('Studio not found');

    const { data: photos } = await supabase
      .from('studio_photos')
      .select('*')
      .eq('studioId', studio.id)
      .order('order');

    return { photos: photos || [], studioId: studio.id };
  } catch (error: any) {
    console.error('Error fetching studio photos:', error);
    throw error;
  }
}

/**
 * Add a new studio photo
 */
export async function addStudioPhoto(
  userId: string,
  imageUrl: string,
  caption?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!artistProfile) throw new Error('Artist profile not found');

    const { data: studio } = await supabase
      .from('studios')
      .select('id')
      .eq('ownerId', artistProfile.id)
      .single();

    if (!studio) throw new Error('Studio not found');

    // Get current max order
    const { data: maxPhoto } = await supabase
      .from('studio_photos')
      .select('order')
      .eq('studioId', studio.id)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (maxPhoto?.order ?? -1) + 1;

    const { error } = await supabase
      .from('studio_photos')
      .insert({
        id: generateUUID(),
        studioId: studio.id,
        imageUrl,
        caption,
        order: newOrder,
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error adding studio photo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a studio photo
 */
export async function deleteStudioPhoto(
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('studio_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting studio photo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reorder studio photos
 */
export async function reorderStudioPhotos(
  photos: Array<{ id: string; order: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update order for each photo
    const updates = photos.map((photo) =>
      supabase
        .from('studio_photos')
        .update({ order: photo.order })
        .eq('id', photo.id)
    );

    await Promise.all(updates);

    return { success: true };
  } catch (error: any) {
    console.error('Error reordering studio photos:', error);
    return { success: false, error: error.message };
  }
}

