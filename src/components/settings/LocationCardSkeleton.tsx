import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { View } from "react-native";

export function LocationCardSkeleton() {
  return (
    <View
      className="bg-[#100C0C] rounded-xl border border-gray/50"
      style={{
        padding: s(16),
        marginBottom: mvs(12),
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1" style={{ marginRight: s(12) }}>
          {/* Location name skeleton with shimmer */}
          <View
            className="bg-gray/30 rounded"
            style={{ width: "70%", height: s(16) }}
          />

          {/* Address skeleton */}
          {/* <View
            className="bg-gray/20 rounded"
            style={{ width: "90%", height: s(12), marginTop: mvs(8) }}
          /> */}
        </View>

        {/* Icons skeleton */}
        <View className="flex-row items-center" style={{ gap: s(12) }}>
          <SVGIcons.Pen2 width={s(16)} height={s(16)} color="#4D4D4D" />
          <SVGIcons.Trash width={s(16)} height={s(16)} color="#4D4D4D" />
        </View>
      </View>
    </View>
  );
}

export function FullPageLocationSkeleton() {
  return (
    <>
      {/* Description */}
      <View style={{ marginBottom: mvs(24) }} className="items-center">
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-foreground font-montserratMedium"
        >
          In questa sezione puoi aggiungere altre città oltre a{" "}
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-montserratBold"
          >
            la tua posizione principale
          </ScaledText>
          che hai scelto durante la registrazione
        </ScaledText>
      </View>

      {/* Primary Location */}
      <View style={{ marginBottom: mvs(10) }}>
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-gray font-neueLight"
          style={{ marginBottom: mvs(6) }}
        >
          Posizione principale
        </ScaledText>
        <LocationCardSkeleton />
      </View>

      {/* Displayed as info */}
      <View style={{ marginBottom: mvs(24) }}>
        <ScaledText
          allowScaling={false}
          variant="11"
          className="text-gray/50 font-normal italic"
        >
          Mostrata come "Comune, Provincia"
        </ScaledText>
        <ScaledText
          allowScaling={false}
          variant="11"
          className="text-gray/50 font-normal italic"
          style={{ marginTop: mvs(4) }}
        >
          es: "Battipaglia, Salerno"
        </ScaledText>
      </View>

      {/* Other Locations */}
      <View style={{ marginBottom: mvs(24) }}>
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground/50 font-neueLight"
          style={{ marginBottom: mvs(6) }}
        >
          Altre posizioni
        </ScaledText>
      </View>

      {/* Add Location Button Skeleton */}
      <View
        className="border border-dashed border-gray/50 rounded-xl items-center flex-row"
        style={{
          paddingVertical: mvs(13),
          paddingHorizontal: s(13),
          gap: s(8),
          opacity: 0.5,
        }}
      >
        <View
          className="bg-primary/50 rounded-full items-center justify-center"
          style={{ width: s(24), height: s(24) }}
        >
          <SVGIcons.Plus width={s(12)} height={s(12)} color="#AD2E2E" />
        </View>
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground/50 font-montserratSemibold"
        >
          Aggiungi posizioni
        </ScaledText>
      </View>
    </>
  );
}
