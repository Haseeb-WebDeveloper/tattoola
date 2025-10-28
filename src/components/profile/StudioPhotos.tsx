import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

interface StudioPhoto {
  id: string;
  imageUrl: string;
  order: number;
}

interface StudioPhotosProps {
  photos: StudioPhoto[];
}

export const StudioPhotos: React.FC<StudioPhotosProps> = ({ photos }) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  const mainPhoto = photos[0];
  const thumbnails = photos.slice(1, 4);
  const remainingCount = Math.max(0, photos.length - 4);

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratSemibold"
        style={{ marginBottom: mvs(12) }}
      >
        Foto dello studio
      </ScaledText>
      
      <View className="flex-row">
        {/* Large main photo */}
        <TouchableOpacity activeOpacity={0.8} style={{ marginRight: s(6) }}>
          <Image
            source={{ uri: mainPhoto.imageUrl }}
            style={{
              width: s(282),
              height: mvs(173),
              borderRadius: s(6),
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Three small thumbnails */}
        <View>
          {thumbnails.map((photo, index) => {
            const isLast = index === 2 && remainingCount > 0;
            
            return (
              <TouchableOpacity 
                key={photo.id} 
                activeOpacity={0.8}
                style={{ marginBottom: index < thumbnails.length - 1 ? mvs(10) : 0 }}
              >
                <View>
                  <Image
                    source={{ uri: photo.imageUrl }}
                    style={{
                      width: s(62),
                      height: mvs(51),
                      borderRadius: s(4),
                    }}
                    resizeMode="cover"
                  />
                  {isLast && (
                    <View
                      className="absolute inset-0 items-center justify-center"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        borderRadius: s(4),
                      }}
                    >
                      <ScaledText
                        allowScaling={false}
                        variant="sm"
                        className="text-white font-neueBold"
                      >
                        +{remainingCount} more
                      </ScaledText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

