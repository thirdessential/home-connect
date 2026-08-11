import { UserType } from "@/types/roles";
import { Society } from "@/types/society.type";

export const getPendingColor = (days: number) => {
    if (days >= 5) return "#FF6B6B";
    if (days >= 3) return "#FFB84D";
    if (days >= 0) return "#4B5563";
    return "#96CEB4";
};

export const getTowerName = (tower: string | { _id: string; name?: string } | null | undefined, society: Society | null) => {
    if (!tower) return "Unknown Tower";
    // If tower is already a populated object with a name, use it directly
    if (typeof tower === "object" && tower.name) return tower.name;
    // Otherwise treat it as an ID and look it up in society.towers
    const towerId = typeof tower === "object" ? tower._id : tower;
    if (!towerId || !society || !Array.isArray(society.towers)) return "Unknown Tower";
    const found = society.towers.find((t) => t._id === towerId);
    return found?.name || "Unknown Tower";
};

// Helper function to get status from verification object
export const getVerificationStatus = (
    item: any,
    type: "user" | "business" | "deal" | "service"
) => {
    if (type === "user") {
        return item?.isAddressVerified?.status || "pending";
    } else {
        return item?.verificationStatus?.status || "pending";
    }
};

// Reuse a single date formatter instance (falls back to toLocaleDateString if Intl is unavailable)
const dateFormatter: Intl.DateTimeFormat | null =
    typeof Intl !== "undefined" && (Intl as any).DateTimeFormat
        ? new Intl.DateTimeFormat()
        : null;

const formatDate = (d: Date) => (dateFormatter ? dateFormatter.format(d) : d.toLocaleDateString());

// Helper function to transform store data into displayable format
export const transformDataForDisplay = (
    item: any,
    type: "user" | "business" | "deal" | "service",
    society: Society | null = null
) => {
    // Guard for nullish item
    if (!item) return item;

    const status = getVerificationStatus(item, type);
    const nowMs = Date.now();
    const createdMs = item?.createdAt ? new Date(item.createdAt).getTime() : nowMs;
    const daysDiff = Math.floor((nowMs - createdMs) / (1000 * 3600 * 24));
    const createdDateStr = formatDate(new Date(createdMs));

    // Destructure frequently used fields once
    const {
        _id,
        fullName,
        profilePhotoUrl,
        completeAddress,
        flatNo,
        societyIds,
        tower,
        images,
        title,
        name,
        category,
        city,
        categoryId,
        userId,
    } = item;

    if (type === "user") {
        const towerName = getTowerName(tower, society);

        return {
            id: _id,
            type: UserType.RESIDENT,
            name: fullName || "Unknown User",
            society: society?.name || "Unknown Society",
            flatTower: `${towerName}, Apt ${flatNo || "Unknown"}`,
            appliedDate: createdDateStr,
            from: completeAddress || "Unknown Address",
            pendingDays: daysDiff,
            isVerified: status === "approved",
            proofType: "View Document",
            status: status,
            avatar:
                profilePhotoUrl ||
                fullName?.substring(0, 2).toUpperCase() ||
                "US",
        };
    } else if (type === "business") {
        return {
            id: _id,
            type: UserType.BUSINESS,
            name: title || name || "Unknown Business",
            location: completeAddress || "Unknown Location",
            address: completeAddress || "Unknown Address",
            category: category || "Unknown Category",
            appliedDate: createdDateStr,
            from: city || "Unknown City",
            pendingDays: daysDiff,
            isVerified: status === "approved",
            subtext: society?.name || "Unknown Society",
            proofType: "View Document",
            status: status,
            avatar: images?.[0] || "BU",
            ownerId: typeof userId === "object" ? userId?._id : userId,
        };
    } else if (type === "deal") {
        // deal
        return {
            id: _id,
            type: UserType.DEAL,
            name: title || "Unknown Deal",
            location: completeAddress || "Unknown Location",
            address: completeAddress || "Unknown Address",
            category: category || "Unknown Category",
            appliedDate: createdDateStr,
            from: city || "Unknown City",
            pendingDays: daysDiff,
            isVerified: status === "approved",
            proofType: "View Document",
            status: status,
            avatar: images?.[0] || "DE",
            ownerId: typeof userId === "object" ? userId?._id : userId,
        };
    } else if (type === "service") {
        return {
            id: _id,
            type: UserType.SERVICE,
            serviceType: item.serviceType || "Unknown Service Type",
            description: item.description || "No description provided",
            name: name || "Unknown Service",
            society: societyIds?.[0]?.name || "Unknown Society",
            location: societyIds?.[0]?.name || "Unknown Location",
            address: completeAddress || "Unknown Address",
            category: categoryId || "Unknown Category",
            appliedDate: createdDateStr,
            from: city || "Pune",
            pendingDays: daysDiff,
            isVerified: status === "approved",
            proofType: "View Document",
            status: status,
            avatar: images?.[0] || "SE",
            additionalInfo: item.additionalInfo || "",
            ownerId: typeof userId === "object" ? userId?._id : userId,
        };
    }
};
