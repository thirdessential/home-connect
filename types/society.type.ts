
export interface Society {
    _id: string;       // unique id
    name: string;      // society name
    totalFlats?: number;
    maintenanceCharge?: number;
    towers?: Tower[];
    buildings?: number;
    pincode?: string;
    completeAddress?: string;
    city?: string;
    state?: string;
    locality?: string;
    totalResidents?: number;
};

export interface SelectedSociety {
    _id: string;       // unique id
    name: string;      // society name
    towerName?: string;
    flatNumber?: string;
    pincode?: string;
    completeAddress?: string;
    city?: string;
    state?: string;
}

export interface Tower {
    _id: string;
    name: string;
    floors?: number;
    flatsPerFloor?: number;
    totalFlats?: number;
    residentsCount?: number;
}
export interface Result {
    loading: boolean;
    error: string | null;
    societies: Society[];
    canQuery: boolean;         // true only when pincode is a valid 6-digit string
    refresh: () => void;       // manual retrigger (if needed)
};

export type SocietyStore = {
    societies: Society[];
    selectedSociety: Society | null;
    towerList: Tower[];
    totalResidents: number;
    getTotalResidents: () => Promise<void>;
    loading: boolean;
    error: string | null;
    // Set when getAllSociety fails because of the OTP/location gate, so the UI
    // knows which onboarding step to send the user back to.
    errorStep: "verify-otp" | "save-location" | null;
    _hasHydrated: boolean;
    setSocieties: (societies: Society[]) => void;
    getAllSociety: () => Promise<void>;
    selectSociety: (societyId: string) => Promise<Society | null>;
    submitVerification: (payload: {
        society_id?: string;
        full_name?: string;
        email?: string;
        tower?: string;
        flat_no?: string;
    }) => Promise<any>;
    setSelectedSociety: (society: Society | null, towerList: Tower[]) => void;
    getTowerById: (towerId: string, towerList: Tower[]) => Tower | null;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    _setHasHydrated: (v: boolean) => void;
    clear: () => void;
};