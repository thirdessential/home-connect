import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS, Alert, Platform } from "react-native";

export type PickImageOptions = {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number; // 0..1
};

const defaultOpts: PickImageOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
};

export const CROP_RATIOS: Record<"1:1" | "4:5" | "16:9", [number, number]> = {
    "1:1": [1, 1],
    "4:5": [4, 5],
    "16:9": [16, 9],
};

/** Ask the user which crop ratio to apply; resolves to a native aspect tuple. */
export async function chooseCropRatio(): Promise<[number, number] | null> {
    return new Promise((resolve) => {
        const opts: Array<keyof typeof CROP_RATIOS> = ["1:1", "4:5", "16:9"];
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: ["Cancel", ...opts], cancelButtonIndex: 0 },
                (idx) => resolve(idx === 0 ? null : CROP_RATIOS[opts[idx - 1]]),
            );
        } else {
            Alert.alert(
                "Choose crop ratio",
                undefined,
                [
                    ...opts.map((r) => ({ text: r, onPress: () => resolve(CROP_RATIOS[r]) })),
                    { text: "Cancel", style: "cancel" as const, onPress: () => resolve(null) },
                ],
            );
        }
    });
}

async function ensureLibraryPermission() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return perm.status === "granted";
}

async function ensureCameraPermission() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    return perm.status === "granted";
}

export async function pickFromLibrary(
    opts: PickImageOptions = defaultOpts
): Promise<ImagePicker.ImagePickerAsset | null> {
    const ok = await ensureLibraryPermission();
    if (!ok) {
        Alert.alert("Permission needed", "Please allow Photos access to continue.");
        return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        // Cropping is mandatory for every flow — never let a caller disable it.
        allowsEditing: true,
        aspect: opts.aspect ?? defaultOpts.aspect,
        quality: opts.quality,
    });
    if (res.canceled) return null;
    return res.assets[0];
}

export async function takePhoto(
    opts: PickImageOptions = defaultOpts
): Promise<ImagePicker.ImagePickerAsset | null> {
    const ok = await ensureCameraPermission();
    if (!ok) {
        Alert.alert("Permission needed", "Please allow Camera access to continue.");
        return null;
    }
    const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: opts.aspect ?? defaultOpts.aspect,
        quality: opts.quality,
    });
    if (res.canceled) return null;
    return res.assets[0];
}

/**
 * THE single reusable crop flow: choose ratio → capture/pick → native crop →
 * confirm. Every Camera/Gallery entry point in the app should call this
 * (directly, or via pickImageWithMenu) instead of hitting expo-image-picker
 * itself, so cropping can never be skipped and there is one place to change
 * behaviour.
 */
export async function pickImageCropped(
    source: "camera" | "library",
    opts: PickImageOptions = defaultOpts,
): Promise<ImagePicker.ImagePickerAsset | null> {
    const aspect = await chooseCropRatio();
    if (!aspect) return null; // user cancelled the ratio step
    return source === "camera"
        ? takePhoto({ ...opts, aspect })
        : pickFromLibrary({ ...opts, aspect });
}

/**
 * Show a platform menu and return the picked asset.
 * If allowRemove is true and user taps "Remove Photo", returns { removed: true } via the special shape below.
 */
export async function pickImageWithMenu(
    opts: PickImageOptions = defaultOpts,
    { allowRemove = false }: { allowRemove?: boolean } = {}
): Promise<{ asset?: ImagePicker.ImagePickerAsset; removed?: true } | null> {
    if (Platform.OS === "ios") {
        return new Promise((resolve) => {
            const options = [
                "Cancel",
                "Take Photo",
                "Choose from Library",
                ...(allowRemove ? ["Remove Photo"] : []),
            ];
            const cancelButtonIndex = 0;
            const destructiveButtonIndex = allowRemove ? options.length - 1 : undefined;

            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex,
                    userInterfaceStyle: "light",
                },
                async (idx) => {
                    if (idx === 1) {
                        const asset = await pickImageCropped("camera", opts);
                        resolve(asset ? { asset } : null);
                    } else if (idx === 2) {
                        const asset = await pickImageCropped("library", opts);
                        resolve(asset ? { asset } : null);
                    } else if (allowRemove && idx === options.length - 1) {
                        resolve({ removed: true });
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    } else {
        return new Promise((resolve) => {
            Alert.alert(
                "Profile picture",
                undefined,
                [
                    {
                        text: "Take Photo", onPress: async () => {
                            const asset = await pickImageCropped("camera", opts);
                            resolve(asset ? { asset } : null);
                        }
                    },
                    {
                        text: "Choose from Library", onPress: async () => {
                            const asset = await pickImageCropped("library", opts);
                            resolve(asset ? { asset } : null);
                        }
                    },
                    ...(allowRemove
                        ? [{ text: "Remove Photo", style: 'destructive' as 'destructive', onPress: () => resolve({ removed: true as const }) }]
                        : []),
                    { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
                ],
                { cancelable: true }
            );
        });
    }
}
