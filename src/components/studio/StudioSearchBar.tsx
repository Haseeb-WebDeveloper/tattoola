import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

interface StudioSearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  showError?: boolean;
  errorMessage?: string;
}

export const StudioSearchBar: React.FC<StudioSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  showError = false,
  errorMessage,
}) => {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: mvs(6),
        }}
      >
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-tat font-montserratSemibold"
        >
          Inserisci username o email dell'artista
        </ScaledText>
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-primary"
          style={{ marginLeft: s(4) }}
        >
          *
        </ScaledText>
      </View>
      
      <View style={{ marginBottom: mvs(12) }}>
        <View
          className="border border-gray flex-row items-center bg-tat-foreground"
          style={{ borderRadius: s(8), paddingVertical: mvs(1) }}
        >
          <View style={{ paddingLeft: s(12) }}>
            <SVGIcons.Search2 width={s(15)} height={s(15)} />
          </View>
          <ScaledTextInput
            containerClassName="flex-1 rounded-full bg-tat-foreground"
            placeholder="pippopluto@gmail.com"
            value={searchQuery}
            onChangeText={onSearchChange}
            className={`bg-tat-foreground text-white ${
              showError ? "border-error" : "border-gray"
            }`}
            style={{
              fontSize: s(12),
            }}
          />
        </View>
        {showError && errorMessage && (
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-error font-neueLight"
            style={{ marginTop: mvs(8), marginBottom: mvs(12) }}
          >
            {errorMessage}
          </ScaledText>
        )}
      </View>
    </>
  );
};

