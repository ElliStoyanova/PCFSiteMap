import { IInputs, IOutputs } from "./generated/ManifestTypes";
/// <reference types="@types/google.maps" />

export class SiteMapControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _map: google.maps.Map | null = null;
    private _notifyOutputChanged: () => void;
    private _kmlUrl: string | null = null;
    private _initialLat = 0;
    private _initialLng = 0;
    private _initialZoom = 10;

    constructor() {
        this._container = document.createElement("div");
        this._container.style.width = "100%"; 
        this._container.style.height = "800px";
    }

    /**
     * Called when the PCF component is initialized.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;

        // Set container style

        console.log("Container at init:", this._container);
        console.log("Contеxt at init:", this._context);

        if (!this._container) {
            console.error("Error: Container is undefined in init.");
            return;
        }

        this._container.style.width = "100%";
        this._container.style.height = "800px"; // Adjust as needed

        // Get KML URL from Dataverse (if stored in a file column)
        this._kmlUrl = this.getGoogleDriveDownloadLink(this.getGoogleDriveFileId(context.parameters.kmlUrl.raw));
        this._initialLat = context.parameters.latitude.raw || 0;
        this._initialLng = context.parameters.longitude.raw || 0;
        console.log("Initial lng and lat:", this._initialLat, this._initialLng);

        // Load Google Maps dynamically
        this.loadGoogleMaps().then(() => {
            console.log("Google Maps API loaded successfully.");
            this.initializeMap();
            return true;
        }).catch(error => {
            console.error("Google Maps API failed to load:", error);
            throw error;
        });
    }

    /**
     * Loads Google Maps API dynamically.
     */
    private loadGoogleMaps(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).google && (window as any).google.maps) {
                resolve(); // Google Maps is already loaded
                return;
            }

            const script = document.createElement("script");
            script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyACfSSfX667ybhuPP9tNXi_b2FF-YXElRE";
            script.async = true;
            script.defer = true;

            script.onload = () => {
                if ((window as any).google && (window as any).google.maps) {
                    resolve();
                } else {
                    reject(new Error("Google Maps API failed to load correctly."));
                }
            };
    
            script.onerror = () => reject(new Error("Failed to load Google Maps API script."));

            document.head.appendChild(script);
        });
    }


    private getGoogleDriveFileId(url: string | null) {

        if (!url) {
            return null;
        }

        const regex = /\/d\/([^/]+)/; // Regular expression to match /d/ and capture the ID
        const match = url.match(regex);

        if (match && match[1]) {
          return match[1];
        } else {
          return null; // Or handle the case where the ID is not found
        }

    }

    private getGoogleDriveDownloadLink(fileId: string | null): string {
        return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : '';
    }


    /**
     * Initializes the Google Map and KML layer.
     */
    private initializeMap(): void {
        if (!this._container) return;

        this._map = new google.maps.Map(this._container, {
            center: { lat: this._initialLat, lng: this._initialLng }, 
            // center: { lat: 42.6975, lng: 23.3242 }, 
            zoom: this._initialZoom
        });

        // If there's a KML file, add it to the map
        if (this._kmlUrl) {
            this.addKmlLayer(this._kmlUrl);
        }
    }

    /**
     * Adds a KML layer to the map.
     */
    private addKmlLayer(kmlUrl: string): void {
        if (!this._map) return;

        const kmlLayer = new google.maps.KmlLayer({
            url: kmlUrl,
            map: this._map,
            preserveViewport: true
        });

        kmlLayer.addListener("status_changed", () => {
            if (kmlLayer.getStatus() !== "OK") {
                console.error("Error loading KML:", kmlLayer.getStatus());
            }
        });
    }

    /**
     * Called when data changes.
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const newKmlUrl = this.getGoogleDriveDownloadLink(this.getGoogleDriveFileId(context.parameters.kmlUrl.raw));

        if (newKmlUrl !== this._kmlUrl) {
            this._kmlUrl = newKmlUrl;

            // Reload KML Layer
            if (this._kmlUrl && this._map) {
                this.addKmlLayer(this._kmlUrl);
            }
        }
    }

    /**
     * Cleans up the component when removed.
     */
    public destroy(): void {
        // Cleanup if needed
    }
}
