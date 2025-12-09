// Supabase database types - these should match your Supabase schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          firstName: string | null;
          lastName: string | null;
          avatar: string | null;
          bio: string | null;
          phone: string | null;
          // country: string | null;
          // province: string | null;
          // municipality: string | null;
          instagram: string | null;
          tiktok: string | null;
          isActive: boolean;
          isVerified: boolean;
          isPublic: boolean;
          role: 'ADMIN' | 'ARTIST' | 'TATTOO_LOVER';
          createdAt: string;
          updatedAt: string;
          lastLoginAt: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          firstName?: string | null;
          lastName?: string | null;
          avatar?: string | null;
          bio?: string | null;
          phone?: string | null;
          country?: string | null;
          province?: string | null;
          municipality?: string | null;
          instagram?: string | null;
          tiktok?: string | null;
          isActive?: boolean;
          isVerified?: boolean;
          isPublic?: boolean;
          role?: 'ADMIN' | 'ARTIST' | 'TATTOO_LOVER';
          createdAt?: string;
          updatedAt?: string;
          lastLoginAt?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          firstName?: string | null;
          lastName?: string | null;
          avatar?: string | null;
          bio?: string | null;
          phone?: string | null;
          country?: string | null;
          province?: string | null;
          municipality?: string | null;
          instagram?: string | null;
          tiktok?: string | null;
          isActive?: boolean;
          isVerified?: boolean;
          isPublic?: boolean;
          role?: 'ADMIN' | 'ARTIST' | 'TATTOO_LOVER';
          createdAt?: string;
          updatedAt?: string;
          lastLoginAt?: string | null;
        };
      };
      artist_profiles: {
        Row: {
          id: string;
          userId: string;
          certificateUrl: string | null;
          portfolioComplete: boolean;
          yearsExperience: number | null;
          specialties: string[];
          businessName: string | null;
          studioAddress: string | null;
          province: string | null;
          municipality: string | null;
          location: string | null;
          city: string | null;
          country: string | null;
          instagram: string | null;
          website: string | null;
          phone: string | null;
          workArrangement: 'STUDIO_OWNER' | 'STUDIO_EMPLOYEE' | 'FREELANCE' | null;
          isStudioOwner: boolean;
          minimumPrice: number | null;
          hourlyRate: number | null;
          coverPhoto: string | null;
          coverVideo: string | null;
          mainStyleId: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          certificateUrl?: string | null;
          portfolioComplete?: boolean;
          yearsExperience?: number | null;
          specialties?: string[];
          businessName?: string | null;
          studioAddress?: string | null;
          province?: string | null;
          municipality?: string | null;
          location?: string | null;
          city?: string | null;
          country?: string | null;
          instagram?: string | null;
          website?: string | null;
          phone?: string | null;
          workArrangement?: 'STUDIO_OWNER' | 'STUDIO_EMPLOYEE' | 'FREELANCE' | null;
          isStudioOwner?: boolean;
          minimumPrice?: number | null;
          hourlyRate?: number | null;
          coverPhoto?: string | null;
          coverVideo?: string | null;
          mainStyleId?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          certificateUrl?: string | null;
          portfolioComplete?: boolean;
          yearsExperience?: number | null;
          specialties?: string[];
          businessName?: string | null;
          studioAddress?: string | null;
          province?: string | null;
          municipality?: string | null;
          location?: string | null;
          city?: string | null;
          country?: string | null;
          instagram?: string | null;
          website?: string | null;
          phone?: string | null;
          workArrangement?: 'STUDIO_OWNER' | 'STUDIO_EMPLOYEE' | 'FREELANCE' | null;
          isStudioOwner?: boolean;
          minimumPrice?: number | null;
          hourlyRate?: number | null;
          coverPhoto?: string | null;
          coverVideo?: string | null;
          mainStyleId?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      tattoo_styles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          imageUrl: string | null;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          imageUrl?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          imageUrl?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      provinces: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          country: string;
          isActive: boolean;
          createdAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          country?: string;
          isActive?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          country?: string;
          isActive?: boolean;
          createdAt?: string;
        };
      };
      municipalities: {
        Row: {
          id: string;
          name: string;
          provinceId: string;
          postalCode: string | null;
          isActive: boolean;
          createdAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          provinceId: string;
          postalCode?: string | null;
          isActive?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          provinceId?: string;
          postalCode?: string | null;
          isActive?: boolean;
          createdAt?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          imageUrl: string | null;
          category: string;
          styleId: string | null;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          imageUrl?: string | null;
          category: string;
          styleId?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          styleId?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      body_parts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          isActive: boolean;
          createdAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          isActive?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          isActive?: boolean;
          createdAt?: string;
        };
      };
      portfolio_projects: {
        Row: {
          id: string;
          artistId: string;
          title: string | null;
          description: string | null;
          order: number;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          artistId: string;
          title?: string | null;
          description?: string | null;
          order?: number;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          artistId?: string;
          title?: string | null;
          description?: string | null;
          order?: number;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      portfolio_project_media: {
        Row: {
          id: string;
          projectId: string;
          mediaType: 'IMAGE' | 'VIDEO';
          mediaUrl: string;
          order: number;
          createdAt: string;
        };
        Insert: {
          id?: string;
          projectId: string;
          mediaType?: 'IMAGE' | 'VIDEO';
          mediaUrl: string;
          order?: number;
          createdAt?: string;
        };
        Update: {
          id?: string;
          projectId?: string;
          mediaType?: 'IMAGE' | 'VIDEO';
          mediaUrl?: string;
          order?: number;
          createdAt?: string;
        };
      };
      user_favorite_styles: {
        Row: {
          id: string;
          userId: string;
          styleId: string;
          order: number;
        };
        Insert: {
          id?: string;
          userId: string;
          styleId: string;
          order?: number;
        };
        Update: {
          id?: string;
          userId?: string;
          styleId?: string;
          order?: number;
        };
      };
      artist_favorite_styles: {
        Row: {
          id: string;
          artistId: string;
          styleId: string;
          order: number;
        };
        Insert: {
          id?: string;
          artistId: string;
          styleId: string;
          order?: number;
        };
        Update: {
          id?: string;
          artistId?: string;
          styleId?: string;
          order?: number;
        };
      };
      artist_services: {
        Row: {
          id: string;
          artistId: string;
          serviceId: string;
          price: number | null;
          duration: number | null;
          isActive: boolean;
          createdAt: string;
        };
        Insert: {
          id?: string;
          artistId: string;
          serviceId: string;
          price?: number | null;
          duration?: number | null;
          isActive?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          artistId?: string;
          serviceId?: string;
          price?: number | null;
          duration?: number | null;
          isActive?: boolean;
          createdAt?: string;
        };
      };
      artist_body_parts: {
        Row: {
          id: string;
          artistId: string;
          bodyPartId: string;
        };
        Insert: {
          id?: string;
          artistId: string;
          bodyPartId: string;
        };
        Update: {
          id?: string;
          artistId?: string;
          bodyPartId?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'ADMIN' | 'ARTIST' | 'TATTOO_LOVER';
      work_arrangement: 'STUDIO_OWNER' | 'STUDIO_EMPLOYEE' | 'FREELANCE';
      media_type: 'IMAGE' | 'VIDEO';
    };
  };
}
