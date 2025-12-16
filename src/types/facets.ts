export type FacetOption = {
  id: string;
  name: string;
};

export type StyleFacet = FacetOption & {
  imageUrl: string | null;
};

export type ServiceFacet = FacetOption & {
  category: string;
};

export type LocationFacet = FacetOption & {
  province: string;
  municipality: string;
  provinceId: string;
  municipalityId: string;
};

export type Facets = {
  styles: StyleFacet[];
  services: ServiceFacet[];
  locations: LocationFacet[];
};

