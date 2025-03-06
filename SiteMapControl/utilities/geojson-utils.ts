// geojson-utils.ts

interface GeoJsonPoint {
    type: "Point";
    coordinates: [number, number];
}

interface GeoJsonFeature {
    type: "Feature";
    geometry: GeoJsonPoint;
    properties: any;
}

interface GeoJsonFeatureCollection {
    type: "FeatureCollection";
    features: GeoJsonFeature[];
}

export function createGeoJsonPoint(longitude: number, latitude: number): GeoJsonPoint {
    return {
        type: "Point",
        coordinates: [longitude, latitude],
    };
}

export function createGeoJsonFeature(
    longitude: number,
    latitude: number,
    properties: any = {}
): GeoJsonFeature {
    return {
        type: "Feature",
        geometry: createGeoJsonPoint(longitude, latitude),
        properties: properties,
    };
}

export function createGeoJsonFeatureCollection(
    features: GeoJsonFeature[]
): GeoJsonFeatureCollection {
    return {
        type: "FeatureCollection",
        features: features,
    };
}

export function generateGeoJson(coordinates: { latitude: number; longitude: number; properties?: any }[]): string {
    const features: GeoJsonFeature[] = coordinates.map((coord) =>
        createGeoJsonFeature(coord.longitude, coord.latitude, coord.properties)
    );
    const geoJson = createGeoJsonFeatureCollection(features);
    
    return JSON.stringify(geoJson);
}